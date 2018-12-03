DROP TABLE IF EXISTS  Events;

 CREATE TABLE    Events    
   (
   event_date         timestamp    default NULL,
   event_time         time         default NULL,
   event_name         varchar(50)  default NULL,
   description        varchar(300) default NULL,
   notification_pref  varchar(50)  default NULL,
   repeating          varchar(50)  default NULL,
   PRIMARY KEY  (event_date)
   );

INSERT INTO Events VALUES ('2013/07/05','12:20:00','Software Dev Lecture','a waste of time','email','MWF');
INSERT INTO Events VALUES ('2013/07/04','12:20:00','Computer sys Lecture','a waste of time','email','F');
INSERT INTO Events VALUES ('2013/05/05','12:20:00','Discrete Lecture','a waste of time','email','TT');