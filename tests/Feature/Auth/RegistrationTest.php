<?php

use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Fortify\Features;

uses(LazilyRefreshDatabase::class);

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new admin can register', function () {
    $response = $this->post(route('register.store'), [
        'email' => 'admin@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('admin.dashboard', absolute: false));

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'admin@example.com',
        'role' => 'admin',
    ]);

    $user = auth()->user();
    expect($user->role)->toBe('admin');
    expect($user->name)->toBe('admin');
});
