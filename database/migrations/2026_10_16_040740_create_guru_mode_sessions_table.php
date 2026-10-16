<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('guru_mode_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('grade');
            $table->string('material_key', 80);
            $table->string('material_title', 120);
            $table->string('status', 20)->default('active');
            $table->json('turns');
            $table->string('current_question', 240);
            $table->string('current_hint', 240)->nullable();
            $table->unsignedTinyInteger('hint_count')->default(0);
            $table->json('evaluation')->nullable();
            $table->string('understanding_level', 30)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guru_mode_sessions');
    }
};
