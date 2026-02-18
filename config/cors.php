<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(array_map('trim', explode(
        ',',
        env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')
    ))),
    'allowed_origins_patterns' => array_filter(array_map('trim', explode(
        ',',
        env('CORS_ALLOWED_ORIGINS_PATTERNS', '#^https://.*\.vercel\.app$#')
    ))),
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
