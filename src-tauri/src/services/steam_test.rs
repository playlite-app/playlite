#[cfg(test)]
mod tests {
    use crate::services::steam::{detect_adult_content, get_app_details, get_app_reviews};

    #[tokio::test]
    async fn test_get_cyberpunk_details() {
        // Cyberpunk 2077 AppID: 1091500
        let details = get_app_details("1091500").await.unwrap();
        assert!(details.is_some());
        let data = details.unwrap();

        println!("Nome: {}", data.name);
        println!("Descrição: {}", data.short_description);

        let (is_adult, flags) = detect_adult_content(&data);
        println!("É adulto? {} - Flags: {:?}", is_adult, flags);

        assert_eq!(data.name, "Cyberpunk 2077");
        assert!(is_adult); // Cyberpunk deve ser detectado como adulto/maduro
    }

    #[tokio::test]
    async fn test_get_stardew_reviews() {
        // Stardew Valley AppID: 413150
        let reviews = get_app_reviews("413150").await.unwrap();
        assert!(reviews.is_some());
        let data = reviews.unwrap();

        println!("Label: {}", data.review_score_desc);
        println!("Total: {}", data.total_reviews);

        assert!(data.total_reviews > 100000); // Tem muuuuitos reviews
                                              // Stardew geralmente é "Overwhelmingly Positive"
        assert!(data.review_score_desc.contains("Positive"));
    }
}
