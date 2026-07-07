<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\LoginRequest as FortifyLoginRequest;

class LoginRequest extends FortifyLoginRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        $rules = [
            Fortify::username() => 'required|string',
            'password' => 'required|string',
        ];

        $role = $this->input('role');

        if ($role === 'admin') {
            $rules[Fortify::username()] = ['required', 'string', 'email:rfc,dns'];
        } elseif ($role === 'guru') {
            $rules[Fortify::username()] = ['required', 'string', 'regex:/^\d{18}$/'];
        } elseif ($role === 'siswa') {
            $rules[Fortify::username()] = ['required', 'string', 'regex:/^\d{2}\.\d{4}$/'];
        }

        return $rules;
    }

    /**
     * Get custom error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'login.email' => 'Format email tidak valid untuk login Admin.',
            'login.regex' => 'Format kode akses tidak sesuai dengan role yang dipilih.',
        ];
    }
}
