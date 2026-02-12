import UIKit

func Alert(title: String = "提示",
           message: String,
           buttons: [ ( title: String, style: UIAlertAction.Style, handler: (() -> Void)?) ]
) {
    DispatchQueue.main.async {
        guard let topVC = UIApplication.shared.firstKeyWindow?.rootViewController?.topMostViewController() else {
            return
        }
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)

        for button in buttons {
            alert.addAction(UIAlertAction(title: button.title, style: button.style, handler: { _ in
                button.handler?()
            }))
        }

        topVC.present(alert, animated: true, completion: nil)
    }
}
