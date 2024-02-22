<?php

$html = isset($_GET['url']) ? file_get_contents(urldecode($_GET['url'])) : '';
echo htmlentities($html);

?>