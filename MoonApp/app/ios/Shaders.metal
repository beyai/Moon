#include <metal_stdlib>
using namespace metal;

struct VertexOut {
    float4 position [[ position ]];
    half2 texCoord [[ user(texCoord) ]];
};

struct VertexUniforms {
    int orientation;
    int isFrontCamera;
};

// 带旋转的顶点着色器
vertex VertexOut vertexShaderWithRotation(
    uint vid [[vertex_id]],
    constant VertexUniforms &uniforms [[ buffer(1) ]]
) {
    VertexOut out;
    
    const float2 positions[] = {
        float2(-1.0, -1.0),
        float2( 1.0, -1.0),
        float2(-1.0,  1.0),
        float2( 1.0, -1.0),
        float2( 1.0,  1.0),
        float2(-1.0,  1.0)
    };
    
    const half2 texCoords[] = {
        half2(0.0h, 1.0h),
        half2(1.0h, 1.0h),
        half2(0.0h, 0.0h),
        half2(1.0h, 1.0h),
        half2(1.0h, 0.0h),
        half2(0.0h, 0.0h)
    };
    
    out.position = float4( positions[vid], 0.0, 1.0 );
    half2 coord = texCoords[vid];

    switch (uniforms.orientation) {
        case 1:
            coord = half2(1.0h - coord.x, 1.0h - coord.y);
            break;
        case 2:
            coord = half2(coord.y, 1.0h - coord.x);
            break;
        case 3:
            coord = half2(1.0h - coord.y, coord.x);
            break;
        default:
            break;
    }
    
    if (uniforms.isFrontCamera != 0) {
        coord.x = 1.0h - coord.x;
    }

    out.texCoord = coord;
    return out;
}

// 直通片元着色器
fragment half4 fragmentShaderPassthrough( VertexOut in [[ stage_in ]], texture2d<half> inTexture [[ texture(0) ]]) {
    constexpr sampler s(mag_filter::linear, min_filter::linear, address::clamp_to_edge );
    float2 coord = float2(in.texCoord);
    return inTexture.sample(s, coord);
}
