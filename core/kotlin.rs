use std::cell::RefCell;

use regex::Regex;

use crate::repo::{search_file, Tree};

#[derive(Clone)]
pub struct KotlinFile {
    pub url: String,
    pub content: String,
    pub cache_pkg: RefCell<Option<String>>,
    pub cache_class: RefCell<Option<String>>,
}

unsafe impl Send for KotlinFile {}

unsafe impl Sync for KotlinFile {}

impl KotlinFile {
    pub fn package_match(&self, pkg: &str) -> bool {
        {
            let cache = self.cache_pkg.borrow();
            if cache.is_some() {
                if cache.as_ref().unwrap().as_str() == pkg {
                    return true;
                }
            }
        }
        if self.content.contains(format!("package {pkg}").as_str()) {
            *self.cache_pkg.borrow_mut() = Some(String::from(pkg));
            return true;
        }
        false
    }

    pub fn class_match(&self, class: &str) -> bool {
        {
            let cache = self.cache_class.borrow();
            if cache.is_some() {
                if cache.as_ref().unwrap().as_str() == class {
                    return true;
                }
            }
        }
        let regex =  Regex::new(format!("(interface|class|object) \\w+").as_str()).unwrap();
        let mut matches = regex.find_iter(&self.content);
        
        matches.any(|m|{
            let is_class = m.as_str().ends_with(class);
            if is_class {
                *self.cache_class.borrow_mut() = Some(String::from(class));
            }
            is_class
        })
    }

    pub fn search_kotlin_method(&self, method: &str) -> Option<String> {
        let mut index = 0_u32;
        let regex = Regex::new(format!("fun\\s(<.+>(\\s)?)?{method}").as_str()).unwrap();
        println!("Regex: {}", format!("fun\\s(<.+>(\\s)?)?{method}"));
        println!("Content Length: {}", self.content.len());
        for line in self.content.lines() {
            if regex.is_match(line) {
                return Some(format!("{}#L{}", self.url, index + 1));
            }
            index += 1;
        }
        None
    }
}

pub async fn find_kt(tree: &Tree, class: &str, package: &str) -> Option<KotlinFile> {
    let package_path = package.replace(".", "/");
    for c in tree.tree.iter() {
        if c.file_type == "blob" {
            let mut file_name_size = c.path.len() - c.path.split("/").last().unwrap().len();
            if file_name_size != 0 {
                file_name_size -= 1;
            }
            if c.path[..file_name_size].ends_with(package_path.as_str()) {
                let kt = KotlinFile {
                    url: format!("https://github.com/monun/tap/blob/master/{}", c.path),
                    content: search_file("monun/tap", &c.path).await.unwrap(),
                    cache_class: RefCell::new(None),
                    cache_pkg: RefCell::new(None),
                };
                if kt.class_match(class) && kt.package_match(package) {
                    return Some(kt);
                }
            }
        }
    }
    return None;
}