#[macro_export]
macro_rules! fn_name {
    () => {{
        fn dummy() {}
        let type_name = std::any::type_name_of_val(&dummy);
        type_name
            .split("::")
            .last()
            .and_then(|s| s.split("::").nth(0))
            .unwrap_or("unknown")
    }};
}
