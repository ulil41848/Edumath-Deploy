<?php

$curriculum = json_decode(
    file_get_contents(__DIR__.'/../public/guru-curriculum.json'),
    true,
    512,
    JSON_THROW_ON_ERROR
);

return [
    'min_turns' => 3,
    'max_turns' => 5,
    'max_answer_length' => 1200,
    'curriculum' => $curriculum,
];