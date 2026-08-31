<?php

test('returns a successful response and contains favicon links', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertSee('/favicon.ico');
    $response->assertSee('/favicon.svg');
    $response->assertSee('/apple-touch-icon.png');
    $response->assertSee('/favicon-32x32.png');
    $response->assertSee('/favicon-16x16.png');
});
