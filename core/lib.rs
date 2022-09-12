pub mod config;
pub mod kotlin;
pub mod repo;

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test() {
        use crate::config::Config;

        let map = Config {
            owner: String::from("monun/tap"),
            hash: String::from("4527a90b82b321d12f9bbce430d508cb5bee0c49"),
            list: vec![
                String::from("io.github.monun.tap.fake.FakeEntity#addPassenger"),
                String::from("io.github.monun.tap.fake.FakeEntity#removePassenger"),
            ],
        }.load_config()
        .await;

        println!("{}", serde_json::to_string(&map).unwrap());
    }
}

// "monun/tap"
// "4527a90b82b321d12f9bbce430d508cb5bee0c49"
// "io.github.monun.tap.fake.FakeEntity#addPassenger"
// "io.github.monun.tap.fake.FakeEntity#removePassenger"
