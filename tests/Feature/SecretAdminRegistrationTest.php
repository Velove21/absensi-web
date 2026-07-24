<?php

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

test('accessing secret admin register without key is forbidden', function () {
    $response = $this->get('/secret-admin-register');

    $response->assertForbidden();
});

test('accessing secret admin register with invalid key is forbidden', function () {
    $response = $this->get('/secret-admin-register?key=wrongkey');

    $response->assertForbidden();
});

test('accessing secret admin register with valid key returns ok', function () {
    $response = $this->get('/secret-admin-register?key=supersecret123');

    $response->assertOk();
});

test('submitting secret admin register creates admin user and redirects to admin dashboard', function () {
    $response = $this->post('/secret-admin-register?key=supersecret123', [
        'name' => 'Secret Admin',
        'email' => 'secretadmin@admin.com',
        'username' => 'secretadmin',
        'password' => 'admin123',
        'password_confirmation' => 'admin123',
    ]);

    $this->assertAuthenticated();

    $user = User::where('email', 'secretadmin@admin.com')->first();
    expect($user)->not->toBeNull();
    expect($user->role)->toBe('admin');
    expect($user->password_default)->toBeFalse();

    $response->assertRedirect(route('admin.dashboard'));
});
