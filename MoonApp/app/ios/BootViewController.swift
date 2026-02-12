import UIKit

// 代理协议：通知 SceneDelegate 初始化完成
protocol BootViewControllerDelegate: AnyObject {
    func bootTaskDidFinish(url: URL)
}

class BootViewController: UIViewController {
    
    weak var delegate: BootViewControllerDelegate?
    
    private lazy var backgroundImageView: UIImageView = {
        let iv = UIImageView()
        iv.image = UIImage(named: "PageBackgroundDark") // 替换成你的图片名字
        iv.contentMode = .scaleAspectFill
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()
    
    private lazy var statusLabel: UILabel = {
        let label = UILabel()
        label.text = "正在同步配置..."
        label.textColor = .gray
        label.font = .systemFont(ofSize: 16)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private lazy var indicator: UIActivityIndicatorView = {
        let v = UIActivityIndicatorView(style: .medium)
        v.startAnimating()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()
    
    // 重试按钮 (网络失败时显示)
    private lazy var retryButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.setTitle("重试", for: .normal)
        btn.addTarget(self, action: #selector(runBootLogic), for: .touchUpInside)
        btn.isHidden = true
        btn.translatesAutoresizingMaskIntoConstraints = false
        return btn
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        setupUI()
        runBootLogic()
    }
    
    private func setupUI() {
        // 先加背景图
        view.addSubview(backgroundImageView)
        NSLayoutConstraint.activate([
            backgroundImageView.topAnchor.constraint(equalTo: view.topAnchor),
            backgroundImageView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            backgroundImageView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            backgroundImageView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        
        view.addSubview(indicator)
        view.addSubview(statusLabel)
        view.addSubview(retryButton)
        
        NSLayoutConstraint.activate([
            indicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            indicator.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -20),
            
            statusLabel.topAnchor.constraint(equalTo: indicator.bottomAnchor, constant: 10),
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            retryButton.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 20),
            retryButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
    }
    
    @objc private func runBootLogic() {
        // UI 重置
        retryButton.isHidden = true
        indicator.startAnimating()
        statusLabel.text = "加载中..."
    
        NitroMoonBridge.viewDidAppear { url, errorMsg in
            DispatchQueue.main.async {
                if let url = url {
                    self.delegate?.bootTaskDidFinish(url: url)
                } else {
                    self.indicator.stopAnimating()
                    self.statusLabel.text = errorMsg ?? "网络连接失败，请检查网络"
                    self.retryButton.isHidden = false
                }
            }
        }
    }
}
