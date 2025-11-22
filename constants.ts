import { City } from './types';

export const CITIES: City[] = [
  { id: 'kyiv', nameUk: 'Київ', nameEn: 'Kyiv', region: 'Київська область' },
  { id: 'kharkiv', nameUk: 'Харків', nameEn: 'Kharkiv', region: 'Харківська область' },
  { id: 'odesa', nameUk: 'Одеса', nameEn: 'Odesa', region: 'Одеська область' },
  { id: 'dnipro', nameUk: 'Дніпро', nameEn: 'Dnipro', region: 'Дніпропетровська область' },
  { id: 'lviv', nameUk: 'Львів', nameEn: 'Lviv', region: 'Львівська область' },
  { id: 'zaporizhzhia', nameUk: 'Запоріжжя', nameEn: 'Zaporizhzhia', region: 'Запорізька область' },
  { id: 'vinnytsia', nameUk: 'Вінниця', nameEn: 'Vinnytsia', region: 'Вінницька область' },
  { id: 'poltava', nameUk: 'Полтава', nameEn: 'Poltava', region: 'Полтавська область' },
  { id: 'mykolaiv', nameUk: 'Миколаїв', nameEn: 'Mykolaiv', region: 'Миколаївська область' },
  { id: 'chernihiv', nameUk: 'Чернігів', nameEn: 'Chernihiv', region: 'Чернігівська область' },
  { id: 'sumy', nameUk: 'Суми', nameEn: 'Sumy', region: 'Сумська область' },
  { id: 'khmelnytskyi', nameUk: 'Хмельницький', nameEn: 'Khmelnytskyi', region: 'Хмельницька область' },
  { id: 'cherkasy', nameUk: 'Черкаси', nameEn: 'Cherkasy', region: 'Черкаська область' },
  { id: 'chernivtsi', nameUk: 'Чернівці', nameEn: 'Chernivtsi', region: 'Чернівецька область' },
  { id: 'zhytomyr', nameUk: 'Житомир', nameEn: 'Zhytomyr', region: 'Житомирська область' },
  { id: 'rivne', nameUk: 'Рівне', nameEn: 'Rivne', region: 'Рівненська область' },
  { id: 'ivano-frankivsk', nameUk: 'Івано-Франківськ', nameEn: 'Ivano-Frankivsk', region: 'Івано-Франківська область' },
  { id: 'ternopil', nameUk: 'Тернопіль', nameEn: 'Ternopil', region: 'Тернопільська область' },
  { id: 'lutsk', nameUk: 'Луцьк', nameEn: 'Lutsk', region: 'Волинська область' },
  { id: 'uzhhorod', nameUk: 'Ужгород', nameEn: 'Uzhhorod', region: 'Закарпатська область' },
];

export const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
