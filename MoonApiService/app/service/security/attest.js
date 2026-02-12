'use strict';

const _ = require('lodash');
const cbor = require('cbor')
const asn1js = require('asn1js')
const pkijs = require('pkijs')
const { createHash, X509Certificate, createVerify } = require('crypto')
const Service = require('egg').Service;
const { STATUS_TYPES } = require('../../enum');

/** Apple App Attest Root CA */
const APPLE_APP_ATTESTATION_ROOT_CA_PEM = ['-----BEGIN CERTIFICATE-----',
'MIICITCCAaegAwIBAgIQC/O+DvHN0uD7jG5yH2IXmDAKBggqhkjOPQQDAzBSMSYw',
'JAYDVQQDDB1BcHBsZSBBcHAgQXR0ZXN0YXRpb24gUm9vdCBDQTETMBEGA1UECgwK',
'QXBwbGUgSW5jLjETMBEGA1UECAwKQ2FsaWZvcm5pYTAeFw0yMDAzMTgxODMyNTNa',
'Fw00NTAzMTUwMDAwMDBaMFIxJjAkBgNVBAMMHUFwcGxlIEFwcCBBdHRlc3RhdGlv',
'biBSb290IENBMRMwEQYDVQQKDApBcHBsZSBJbmMuMRMwEQYDVQQIDApDYWxpZm9y',
'bmlhMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAERTHhmLW07ATaFQIEVwTtT4dyctdh',
'NbJhFs/Ii2FdCgAHGbpphY3+d8qjuDngIN3WVhQUBHAoMeQ/cLiP1sOUtgjqK9au',
'Yen1mMEvRq9Sk3Jm5X8U62H+xTD3FE9TgS41o0IwQDAPBgNVHRMBAf8EBTADAQH/',
'MB0GA1UdDgQWBBSskRBTM72+aEH/pwyp5frq5eWKoTAOBgNVHQ8BAf8EBAMCAQYw',
'CgYIKoZIzj0EAwMDaAAwZQIwQgFGnByvsiVbpTKwSga0kP0e8EeDS4+sQmTvb7vn',
'53O5+FRXgeLhpJ06ysC5PrOyAjEAp5U4xDgEgllF7En3VcE3iexZZtKeYnpqtijV',
'oyFraWVIyd/dganmrduC1bmTBGwD',
'-----END CERTIFICATE-----'].join("\n")

const APPLE_APP_ATTESTATION_ROOT_CA = new X509Certificate(APPLE_APP_ATTESTATION_ROOT_CA_PEM);
const APPATTESTDEVELOP = Buffer.from('appattestdevelop').toString('hex');
const APPATTESTPROD = Buffer.concat([
    Buffer.from('appattest'), Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
]).toString('hex');


class AttestService extends Service {

    /**
     * App 正版验证模型
     */
    get AttestModel() {
        return this.app.model.Attest
    }

    /**
     * 过期时间
     */
    get challengeTTL() {
        return 30 * 1000
    }

    /**
     * 配置
     */
    get attestConf() {
        return this.config.attest
    }

    /**
     * 生成挑战
     */
    generateChallenge() {
        return this.ctx.encrypt(Date.now())
    }

    /**
     * 验证挑战
     * @param {string} challenge 挑战
     * @returns {boolean}
     */
    verifyChallenge(challenge) {
        const timestamp = this.ctx.decrypt(challenge)
        const now = Date.now()
        const half = this.challengeTTL / 2;
        return now > timestamp - half && now <= timestamp + half
    }

    /**
     * 
     * @param {object} params 
     * @param {string} params.deviceUID
     * @param {Buffer | string} params.challenge
     * @param {string} params.bundleIdentifier
     * @param {string} params.teamIdentifier
     * @param {boolean} params.allowDevelopmentEnvironment
     * @param {Buffer} params.attestation
     * @returns {{
     *  deviceUID: string;
     *  publicKey: string;
     *  receipt: string;
     *  environment: boolean;
     * }} 
     */
    verifyAttestation(params) {
        const { attestation, challenge, keyId, bundleIdentifier, teamIdentifier, allowDevelopmentEnvironment } = params;
        let decodedAttestation = cbor.decode(attestation);

        if (
            decodedAttestation.fmt !== 'apple-appattest' ||
            decodedAttestation.attStmt?.x5c?.length !== 2 ||
            !decodedAttestation.attStmt?.receipt ||
            !decodedAttestation.authData ||
            !Buffer.isBuffer(decodedAttestation.attStmt.x5c[0]) ||
            !Buffer.isBuffer(decodedAttestation.attStmt.x5c[1]) ||
            !Buffer.isBuffer(decodedAttestation.attStmt.receipt) ||
            !Buffer.isBuffer(decodedAttestation.authData)
        ) {
            throw new Error('凭证无效');
        }

        const { authData, attStmt } = decodedAttestation;

        const certificates = attStmt.x5c.map((data) => new X509Certificate(data));
        const subCaCertificate = certificates.find((certificate) => certificate.subject.indexOf('Apple App Attestation CA 1') !== -1);

        if (!subCaCertificate) {
            throw new Error('未找到子证书');
        }

        if (!subCaCertificate.verify(APPLE_APP_ATTESTATION_ROOT_CA.publicKey)) {
            throw new Error('证书非苹果应用认证根签署');
        }

        const clientCertificate = certificates.find((certificate) => certificate.subject.indexOf('Apple App Attestation CA 1') === -1);
        if (!clientCertificate) {
            throw new Error('未找到客户端证书');
        }

        if (!clientCertificate.verify(subCaCertificate.publicKey)) {
            throw new Error('客户端证书非苹果应用认证根签署');
        }

        const clientDataHash = createHash('sha256').update(challenge).digest();

        const nonceData = Buffer.concat([decodedAttestation.authData, clientDataHash]);
        const nonce = createHash('sha256').update(nonceData).digest('hex');

        const asn1 = asn1js.fromBER(clientCertificate.raw);
        const certificate = new pkijs.Certificate({ schema: asn1.result });
        const extension = certificate.extensions.find((e) => e.extnID === '1.2.840.113635.100.8.2');
        const actualNonce = Buffer.from(extension.parsedValue.valueBlock.value[0].valueBlock.value[0].valueBlock.valueHex).toString('hex');
        if (actualNonce !== nonce) {
            throw new Error('随机密码不匹配');
        }

        const publicKey = Buffer.from(certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex);
        const publicKeyHash = createHash('sha256').update(publicKey, 'hex').digest('base64');
        if (publicKeyHash !== keyId) {
            throw new Error('密钥ID不符');
        }

        const appIdHash = createHash('sha256').update(`${teamIdentifier}.${bundleIdentifier}`).digest('base64');
        const rpiIdHash = authData.subarray(0, 32).toString('base64');
        
        if (appIdHash !== rpiIdHash) {
            throw new Error('应用ID不匹配');
        }

        const aaguid = authData.subarray(37, 53).toString('hex');

        if (aaguid !== APPATTESTDEVELOP && aaguid !== APPATTESTPROD) {
            throw new Error('aaguid is not valid');
        }

        if (aaguid === APPATTESTDEVELOP && !allowDevelopmentEnvironment) {
            throw new Error('开发环境不被允许');
        }

        const credentialIdLength = authData.subarray(53, 55).readInt16BE();
        const credentialId = authData.subarray(55, 55 + credentialIdLength);

        if (credentialId.toString('base64') !== keyId) {
            throw new Error('凭证 ID 不匹配');
        }

        return {
            keyId,
            publicKey: clientCertificate.publicKey.export({ type: 'spki', format: 'pem' }),
            receipt: decodedAttestation.attStmt.receipt,
            environment: aaguid === APPATTESTPROD ? 'production' : 'development',
        };

    }

    /**
     * 
     * @param {object} params 
     * @param {Buffer} params.assertion 安全断言标记
     * @param {Buffer | string} params.payload 附载数据
     * @param {string} params.publicKey 设备公钥
     * @param {string} params.bundleIdentifier 包名
     * @param {string} params.teamIdentifier 团队ID
     * @param {number} params.signCount 签名计数
     * @returns {number} 累计签名计数
     */
    verifyAssertion(params) {
        const { assertion, payload, publicKey, bundleIdentifier, teamIdentifier, signCount } = params;
        const { signature, authenticatorData } = cbor.decode(assertion);
        const clientDataHash = createHash('sha256').update(payload).digest();
        const nonce = createHash('sha256').update(Buffer.concat([authenticatorData, clientDataHash])).digest();
        const verifier = createVerify('SHA256');
        verifier.update(nonce);
        if (!verifier.verify(publicKey, signature)) {
            throw new Error('签名无效');
        }
        const appIdHash = createHash('sha256').update(`${teamIdentifier}.${bundleIdentifier}`).digest('base64');
        const rpiIdHash = authenticatorData.subarray(0, 32).toString('base64');
        if (appIdHash !== rpiIdHash) {
            throw new Error('应用ID不匹配');
        }
        const nextSignCount = authenticatorData.subarray(33, 37).readInt32BE();
        if (nextSignCount <= signCount) {
            throw new Error('签名已过期');
        }
        return nextSignCount;
    }

    /**
     * 创建设备证书
     * @param {object} data
     * @param {string} data.deviceUID 设备码
     * @param {string} data.keyId 证书ID
     * @param {string} data.challenge 随机码
     * @param {string} data.attestation 认证数据
     */
    async create(data) {
        const ctx = this.ctx;
        if (_.isEmpty(data.deviceUID)) {
            ctx.throw(400, `缺少 deviceUID 参数`)
        }
        if (_.isEmpty(data.keyId)) {
            ctx.throw(400, `缺少 keyId 参数`)
        }
        if (_.isEmpty(data.challenge)) {
            ctx.throw(400, `缺少 challenge 参数`)
        }
        if (_.isEmpty(data.attestation)) {
            ctx.throw(400, `缺少 attestation 参数`)
        }

        if (!this.verifyChallenge(data.challenge)) {
            ctx.throw(400, `challenge 已失效`)
        }
        try {
            const { publicKey } = this.verifyAttestation({
                attestation: Buffer.from(data.attestation, 'base64'),
                challenge: data.challenge,
                keyId: data.keyId,
                ...this.attestConf
            })

            // 创建或更新
            const [ result, _ ] = await this.AttestModel.upsert({
                deviceUID: data.deviceUID, 
                publicKey,
                signCount: 0
            })

            return result
        } catch (error) {
            ctx.throw(400, error.message)
        }
    }

    /**
     * 验证签名
     * @param {object} data
     * @param {string} data.deviceUID 设备码
     * @param {string} data.assertion 认证数据 Base64
     * @param {string} data.payload base64 格式的 cbor 负载数据
     * @returns {Record<string, any>} 负载数据
     */
    async verifySign(data) {
        const ctx = this.ctx;
        if (_.isEmpty(data.deviceUID)) {
            ctx.throw(400, `缺少 deviceUID 参数`)
        }
        if (_.isEmpty(data.assertion)) {
            ctx.throw(400, `缺少 assertion 参数`)
        }
        if (_.isEmpty(data.payload)) {
            ctx.throw(400, `缺少 payload 参数`)
        }

        // 查找设备证书
        const attest = await this.AttestModel.findOne({
            where: { deviceUID: data.deviceUID },
            attributes: ['id', 'publicKey', 'signCount'],
        })

        if (!attest || attest.status == STATUS_TYPES.DISABLE) {
            ctx.throw(400, '请求无效')
        }

        try {
            // 转换负载数据
            let payload = Buffer.from(data.payload, 'base64')

            const signCount = this.verifyAssertion({
                assertion: Buffer.from(data.assertion, 'base64'),
                payload: payload,
                publicKey: attest.publicKey,
                signCount: attest.signCount,
                ...this.attestConf
            });

            // 更新签名计数
            attest.set('signCount', signCount)
            await attest.save()

            return cbor.decode(payload)
        } catch (error) {
            ctx.throw(400, error.message)
        }
    }

}

module.exports = AttestService;
