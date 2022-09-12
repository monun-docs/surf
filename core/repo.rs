use std::error::Error;

use bytes::{Buf, BufMut, BytesMut};
use hyper::{body::HttpBody, Body, Client, Request};
use hyper_tls::HttpsConnector;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Tree {
    pub sha: String,
    pub url: String,
    pub tree: Vec<Component>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Component {
    pub path: String,
    pub sha: String,
    pub mode: String,
    #[serde(alias = "type")]
    pub file_type: String,
    pub size: Option<u32>,
}

pub async fn load_tree(owner: &str, hash: &str) -> Result<Tree, Box<dyn Error>> {
    let https = HttpsConnector::new();
    let client = Client::builder().build::<_, hyper::Body>(https);
    let request = Request::builder()
        .uri(format!(
            "https://api.github.com/repos/{owner}/git/trees/{hash}?recursive=true"
        ))
        .header("User-Agent", "MyAwesomeAgent/1.0")
        .body(Body::empty())
        .unwrap();
    let mut res = client.request(request).await?;
    let mut buf = BytesMut::new();
    while let Some(chunk) = res.body_mut().data().await {
        buf.put(&chunk?[..]);
    }
    let tree = serde_json::from_reader::<_, Tree>(buf.reader()).unwrap();
    Ok(tree)
}

pub async fn search_file(owner: &str, path: &str) -> Result<String, Box<dyn Error>> {
    let https = HttpsConnector::new();
    let client = Client::builder().build::<_, hyper::Body>(https);
    let request = Request::builder()
        .uri(format!(
            "https://raw.githubusercontent.com/{owner}/master/{path}"
        ))
        .header("User-Agent", "MyAwesomeAgent/1.0")
        .body(Body::empty())
        .unwrap();
    let mut res = client.request(request).await?;

    let mut buf = BytesMut::new();
    while let Some(chunk) = res.body_mut().data().await {
        buf.put(&chunk?[..]);
    }

    Ok(String::from_utf8(buf.to_vec()).unwrap())
}
