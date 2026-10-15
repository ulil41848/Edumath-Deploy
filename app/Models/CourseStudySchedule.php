<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class CourseStudySchedule extends Model {
    protected $fillable = ['user_id','material_title','semester','starts_at','duration_minutes','reminder_email','reminder_minutes','reminder_sent_at'];
    protected function casts(): array { return ['starts_at'=>'datetime','reminder_sent_at'=>'datetime']; }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
