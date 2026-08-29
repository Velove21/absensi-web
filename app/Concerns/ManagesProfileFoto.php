<?php

namespace App\Concerns;

use App\Models\Foto;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait ManagesProfileFoto
{
    /**
     * Normalize the foto input so an existing photo URL (sent as a string when
     * the admin edits a record without touching the photo) is not validated
     * as an uploaded file.
     */
    protected function normalizeFotoInput(Request $request): void
    {
        if (! $request->hasFile('foto') && $request->filled('foto')) {
            $request->merge(['foto' => null]);
        }
    }

    /**
     * Store a new profile foto for the given guru/siswa record. The foto is
     * croped to a 4x4 cm (1:1, square) ratio before being persisted.
     */
    public function storeFoto(Model $fotoable, $file): void
    {
        $extension = $file->guessExtension() ?: 'jpg';
        $crop = $this->cropToSquare($file);

        if ($crop !== null) {
            [$data, $mimeType] = $crop;

            $path = 'fotos/'.Str::random(40).'.'.$extension;

            Storage::disk('public')->put($path, $data);

            $fileSize = strlen($data);
        } else {
            $path = $file->store('fotos', 'public');
            $mimeType = $file->getMimeType();
            $fileSize = $file->getSize();
        }

        $fotoable->foto()->create([
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
        ]);
    }

    /**
     * Crop a foto into a 480x480 (4x4 cm) square by trimming the excess from
     * the longer side. Returns [data, mimeType] or null when GD can't handle
     * the image (in which case the original file is stored).
     *
     * @return array{0: string, 1: string}|null
     */
    protected function cropToSquare($file): ?array
    {
        $mimeType = $file->getMimeType();

        $source = match ($mimeType) {
            'image/jpeg' => @imagecreatefromjpeg($file->getPathname()),
            'image/png' => @imagecreatefrompng($file->getPathname()),
            'image/webp' => @imagecreatefromwebp($file->getPathname()),
            default => false,
        };

        if (! $source) {
            return null;
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $side = min($width, $height);
        $size = 480;

        $square = imagecreatetruecolor($size, $size);

        if ($mimeType === 'image/png') {
            imagealphablending($square, false);
            imagesavealpha($square, true);
            imagefill($square, 0, 0, imagecolorallocatealpha($square, 0, 0, 0, 127));
        }

        imagecopyresampled(
            $square,
            $source,
            0,
            0,
            intdiv($width - $side, 2),
            intdiv($height - $side, 2),
            $size,
            $size,
            $side,
            $side
        );

        ob_start();

        if ($mimeType === 'image/png') {
            imagepng($square);
        } elseif ($mimeType === 'image/webp') {
            imagewebp($square, null, 90);
        } else {
            imagejpeg($square, null, 90);
        }

        $data = ob_get_clean();

        imagedestroy($source);
        imagedestroy($square);

        return [$data, $mimeType];
    }

    /**
     * Replace the existing profile foto, deleting the previous file.
     */
    public function replaceFoto(Model $fotoable, $file): void
    {
        $this->removeFoto($fotoable);
        $this->storeFoto($fotoable, $file);
    }

    /**
     * Delete the existing profile foto and its stored file.
     */
    public function removeFoto(Model $fotoable): void
    {
        $foto = $fotoable->foto()->first();

        if (! $foto) {
            return;
        }

        if (Storage::disk('public')->exists($foto->file_path)) {
            Storage::disk('public')->delete($foto->file_path);
        }

        $foto->delete();
    }
}
