/*
*Subtitles table
*/
CREATE TABLE IF NOT EXISTS `Subtitles` (
    `id` int(6) PRIMARY KEY auto_increment,
    `subtitle` varchar(100) NOT NULL,
    `id_user` int(6) NOT NULL,
    `created` timestamp DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8;