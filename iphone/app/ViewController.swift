//
//  ViewController.swift
//  app
//
//  Created by MA012 on 2019/9/23.
//  Copyright © 2019 CITI. All rights reserved.
//

import UIKit
import WebKit
import PopupDialog

class ViewController: UIViewController, WKNavigationDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate {

    @IBOutlet weak var webView: WKWebView!
    var rightBarButtonItem : UIBarButtonItem!
    var leftBarButtonItem: UIBarButtonItem!
    
    // upload controller
    let rest = RestManager()
    
    // activity indicator
    let child = SpinnerViewController()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let url = URL(string: "http://"+webapp_url+"/login")
        let request = URLRequest(url: url!)
        
        self.webView.load(request)
        
        self.webView.navigationDelegate = self
        
        // navigation button
        let button = UIButton.init(type: .custom)
        button.setImage(UIImage(named: "outline_camera_alt_black_36pt"), for: UIControl.State.normal)
        button.addTarget(self, action: #selector(ViewController.actionPicture), for: UIControl.Event.touchUpInside)
        button.frame = CGRect(x: 0, y: 0, width: 53, height: 51)
        button.imageEdgeInsets = UIEdgeInsets(top: 0, left: 0, bottom: 0, right: -30)
        
        self.rightBarButtonItem = UIBarButtonItem(customView: button)
        
        let button1 = UIButton.init(type: .custom)
        button1.setImage(UIImage(named: "outline_arrow_back_ios_black_24pt"), for: UIControl.State.normal)
        button1.addTarget(self, action: #selector(ViewController.backAction), for: UIControl.Event.touchUpInside)
        button1.frame = CGRect(x: 0, y: 0, width: 53, height: 51)
        button1.imageEdgeInsets = UIEdgeInsets(top: 0, left: -30, bottom: 0, right: 0)
        
        self.leftBarButtonItem = UIBarButtonItem(customView: button1)
        
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
    }
    
    // back button navigation
    @objc func backAction() {
        let url = URL(string: "http://"+webapp_url+"/")
        let request = URLRequest(url: url!)
        
        self.webView.load(request)
        
        self.webView.navigationDelegate = self
    }
    
    // enable and disable navigation button on some page
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        title = webView.title
        if title == "login" || title == "register" {
            self.navigationItem.rightBarButtonItem = nil
            self.navigationItem.leftBarButtonItem = nil
        } else {
            self.navigationItem.leftBarButtonItem = self.leftBarButtonItem
            self.navigationItem.rightBarButtonItem = self.rightBarButtonItem
        }
    }
    
    // open library or camera action
    @objc func actionPicture() {
        let picker = UIImagePickerController()
        picker.delegate = self
        let alert = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)
        alert.addAction(UIAlertAction(title: "Camera", style: .default, handler: {
            action in
            picker.sourceType = .camera
            self.present(picker, animated: true, completion: nil)
        }))
        alert.addAction(UIAlertAction(title: "Photo Library", style: .default, handler: {
            action in
            picker.sourceType = .photoLibrary
            self.present(picker, animated: true, completion: nil)
        }))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        self.present(alert, animated: true, completion: nil)
    }
    
    // choose image from library
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        
        // Prepare the popup assets
        let message = "Please make sure the object is in center, clear and enough light to make best prediction result."
        
        let image = info[UIImagePickerController.InfoKey.originalImage] as? UIImage

        // Create the dialog
        let popup = PopupDialog(title: nil, message: message, image: image)

        // Create buttons
        let buttonOne = CancelButton(title: "Cancel") {}

        let buttonThree = DefaultButton(title: "Submit") {
            let username = String(self.title!)
            self.uploadImage(title: username, image: image!)
        }

        // Add buttons to dialog
        popup.addButtons([buttonThree, buttonOne])
        
        // remove camera or library dialog
        dismiss(animated: true, completion: nil)
        
        // Present dialog
        self.present(popup, animated: true, completion: nil)
    }
    
    func uploadImage(title: String, image: UIImage) {
        let imageData = image.jpegData(compressionQuality: 1)
        if(imageData == nil) { return }
        
        let name = randomString(length: 20)
        
        let imageFileInfo = RestManager.FileInfo(filename: name+".jpg", name: "image_file", mimetype: "image/jpg", data: imageData! as NSData)
        
        upload(files: [imageFileInfo], toURL: URL(string: "http://"+webapp_url+"/images/upload-image?username="+title))
    }
    
    func randomString(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map{ _ in letters.randomElement()! })
    }
    
    func upload(files: [RestManager.FileInfo], toURL url: URL?) {
        if let uploadURL = url {
            
            addChild(child)
            child.view.frame = view.frame
            view.addSubview(child.view)
            child.didMove(toParent: self)
            
            rest.upload(files: files, toURL: uploadURL, withHttpMethod: .post) { (results, failedFilesList) in
                if(results.response?.httpStatusCode ?? 0 == 200) {
                    if let data = results.data {
                        let jsonResponse = try? JSONSerialization.jsonObject(with: data, options: [])
                        
                        guard let jsonArray = jsonResponse as? [String: Any] else { return }
                        let a = jsonArray["username"] as! String
                        let b = jsonArray["id"] as! String
                        
                        let url = URL(string: "http://"+webapp_url+"/image-details?username="+a+"&id="+b)
                        let request = URLRequest(url: url!)
                        
                        DispatchQueue.main.async {
                            self.webView.load(request)
                            
                            self.webView.navigationDelegate = self
                            
                            self.child.willMove(toParent: nil)
                            self.child.view.removeFromSuperview()
                            self.child.removeFromParent()
                        }
                    }
                }
                else {
                    if let error = results.error {
                        print(error)
                    }
                    
                    if let failedFiles = failedFilesList {
                        for file in failedFiles {
                            print(file)
                        }
                    }
                }
            }
        }
    }
    
}
