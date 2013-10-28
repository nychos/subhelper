/*Користувачі*/
CREATE TABLE IF NOT EXISTS `users` (
    `id` int(6) auto_increment,
    `email` varchar(250),
    `first_name` varchar(100),
    `last_name` varchar(100),
    `added` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
)ENGINE=InnoDB DEFAULT CHARSET=CP1251;

/*Субтитри*/
CREATE TABLE IF NOT EXISTS `subtitles` (
    `id` int(6) auto_increment,
    `subtitle` varchar(100) NOT NULL,
    `id_user` int(6) NOT NULL,
    `created` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/* Зв'язок користувачів та субтитрів */
CREATE TABLE IF NOT EXISTS `users_subtitles`(
    `id_user` int(6) NOT NULL,
    `id_subtitle` int(6) NOT NULL,
    FOREIGN KEY (id_user) REFERENCES `users`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_subtitle) REFERENCES `subtitles`(id) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Список всіх слів задіяних користувачами*/
CREATE TABLE IF NOT EXISTS `words` (
    `id` int(6) auto_increment,
    `word` varchar(100) NOT NULL,
    PRIMARY KEY(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Містить унікальні переклади користувачів*/
CREATE TABLE IF NOT EXISTS `translations` (
    `id` int(6) auto_increment,
    `translation` varchar(250) NOT NULL,
    `id_word` int(6) NOT NULL,
    `id_user` int(6) NOT NULL,
    `added` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
)ENGINE=InnoDB DEFAULT CHARSET=CP1251;

/* Встановлює зв'язкок користувача з перекладом */
CREATE TABLE IF NOT EXISTS `users_translations`(
    `id_user` int(6) NOT NULL,
    `id_translation` int(6) NOT NULL,
    `referrer` int(6) DEFAULT NULL,
    FOREIGN KEY (id_user) REFERENCES `users`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_translation) REFERENCES `translations`(id) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Фрази з яких складаються субтитри*/
CREATE TABLE IF NOT EXISTS `phrases`(
    `id` int(6) auto_increment,
    `phrase` text NOT NULL,
    `id_subtitle` int(6) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (id_subtitle) REFERENCES `subtitles`(id) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Статуси готовності фраз*/
CREATE TABLE IF NOT EXISTS `phrases_statuses`(
    `id_phrase` int(6) NOT NULL,
    `status` ENUM('wait', 'done') NOT NULL,
    `id_user` int(6) NOT NULL,
    FOREIGN KEY (id_phrase) REFERENCES `phrases`(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_user) REFERENCES `users`(id) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8;