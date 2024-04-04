CREATE TABLE IF NOT EXISTS `users` (
  pk_user_id INT NOT NULL UNIQUE AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(8) NOT NULL,
  nome VARCHAR(32),
  srname VARCHAR(32) NOT NULL,
  email VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  language VARCHAR(2) NOT NULL,
  registrydate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `messages` (
  pk_message_id INT NOT NULL UNIQUE AUTO_INCREMENT PRIMARY KEY,
  fk_sender_id INT NOT NULL,
  fk_reciever_id INT NOT NULL,
  sending_data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  msg TEXT,
  FOREIGN KEY (fk_sender_id) REFERENCES users(pk_user_id),
  FOREIGN KEY (fk_reciever_id) REFERENCES users(pk_user_id)
);

CREATE TABLE IF NOT EXISTS `chatgroup` (
  pk_group_id INT NOT NULL UNIQUE AUTO_INCREMENT PRIMARY KEY,
  groupname VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS `grouppeople` (
  pk_grouppeople_id INT NOT NULL UNIQUE AUTO_INCREMENT PRIMARY KEY,
  fk_group_id INT NOT NULL,
  fk_user_id INT NOT NULL,
  FOREIGN KEY (fk_group_id) REFERENCES chatgroup(pk_group_id),
  FOREIGN KEY (fk_user_id) REFERENCES users(pk_user_id)
);
