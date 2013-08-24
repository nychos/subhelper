/*
*Subtitles table
*/
CREATE TABLE IF NOT EXISTS `Subtitles` (
    `id` int(6) PRIMARY KEY auto_increment,
    `subtitle` varchar(100) NOT NULL,
    `id_user` int(6) NOT NULL,
    `created` timestamp DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `Words` (
    `id` int(6) PRIMARY KEY auto_increment,
    `word` varchar(100) NOT NULL,
    `translation` varchar(250) NOT NULL,
    `id_subtitle` int(6),
    `id_user` int(6) NOT NULL,
    `added` timestamp DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=CP2151;