use std::collections::HashMap;

use napi_derive::napi;

use crate::{kotlin::KotlinFile, repo::load_tree};

#[napi(constructor)]
pub struct Config {
    pub owner: String,
    pub hash: String,
    pub list: Vec<String>,
}

/// the configuration
/// {
///     "list": ["io.github.monun.tap.fake.FakeEntity#addPassenger"]
/// }
#[napi]
impl Config {
    #[napi]
    pub async fn load_config(&self) -> HashMap<String, String> {
        let tree = load_tree(&self.owner, &self.hash).await.unwrap();
        let mut cache = Vec::<KotlinFile>::new();
        let mut map = HashMap::new();
        for path in self.list.iter() {
            println!("New Entry: {}", path);
            let class_method = path.split("#").collect::<Vec<&str>>();
            let class = class_method[0].split(".").last().unwrap();
            let mut file_name_size = class_method[0].len() - class.len();
            if file_name_size != 0 {
                file_name_size -= 1;
            }

            let cached_file = cache.iter().find(|x| {
                x.class_match(class) && x.package_match(&class_method[0][..file_name_size])
            });

            let file = if let Some(cached_file) = cached_file {
                cached_file.clone()
            } else {
                let file = crate::kotlin::find_kt(&tree, class, &class_method[0][..file_name_size])
                    .await
                    .unwrap();
                cache.push(file.clone());
                file
            };
            if let Some(item) = file.search_kotlin_method(class_method[1]) {
                map.insert(
                    path.clone(),
                    item,
                );
            } else {
                println!("Skipped")
            }

        }
        map
    }
}
