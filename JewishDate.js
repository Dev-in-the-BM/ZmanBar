
const GREGORIAN_EPOCH = 1721425.5;
const HEBREW_EPOCH = 347995.5;

function mod(a, b) {
  return a - b * Math.floor(a / b);
}

function leapGregorian(year) {
  return year % 4 === 0 && !(year % 100 === 0 && year % 400 !== 0);
}

function gregorianToJd(year, month, day) {
  return (
    GREGORIAN_EPOCH -
    1 +
    365 * (year - 1) +
    Math.floor((year - 1) / 4) +
    -Math.floor((year - 1) / 100) +
    Math.floor((year - 1) / 400) +
    Math.floor(
      (367 * month - 362) / 12 +
        (month <= 2 ? 0 : leapGregorian(year) ? -1 : -2) +
        day,
    )
  );
}

function jdToGregorian(jd) {
  const wjd = Math.floor(jd - 0.5) + 0.5;
  const depoch = wjd - GREGORIAN_EPOCH;
  const quadricent = Math.floor(depoch / 146097);
  const dqc = mod(depoch, 146097);
  const cent = Math.floor(dqc / 36524);
  const dcent = mod(dqc, 36524);
  const quad = Math.floor(dcent / 1461);
  const dquad = mod(dcent, 1461);
  const yindex = Math.floor(dquad / 365);
  let year = quadricent * 400 + cent * 100 + quad * 4 + yindex;
  if (!(cent === 4 || yindex === 4)) {
    year++;
  }
  const yearday = wjd - gregorianToJd(year, 1, 1);
  const leapadj =
    wjd < gregorianToJd(year, 3, 1) ? 0 : leapGregorian(year) ? 1 : 2;
  const month = Math.floor(((yearday + leapadj) * 12 + 373) / 367);
  const day = wjd - gregorianToJd(year, month, 1) + 1;

  return [year, month, day];
}

function hebrewLeap(year) {
  return mod(year * 7 + 1, 19) < 7;
}

function hebrewYearMonths(year) {
  return hebrewLeap(year) ? 13 : 12;
}

function calculateHebrewYearStartDelay(year) {
  const months = Math.floor((235 * year - 234) / 19);
  const parts = 12084 + 13753 * months;
  let day = months * 29 + Math.floor(parts / 25920);

  if (mod(3 * (day + 1), 7) < 3) {
    day++;
  }
  return day;
}

function calculateHebrewYearAdjacentDelay(year) {
  const last = calculateHebrewYearStartDelay(year - 1);
  const present = calculateHebrewYearStartDelay(year);
  const next = calculateHebrewYearStartDelay(year + 1);

  return next - present === 356 ? 2 : present - last === 382 ? 1 : 0;
}

function hebrewYearDays(year) {
  return hebrewToJd(year + 1, 7, 1) - hebrewToJd(year, 7, 1);
}

function hebrewMonthDays(year, month) {
  if (
    month === 2 ||
    month === 4 ||
    month === 6 ||
    month === 10 ||
    month === 13
  ) {
    return 29;
  }

  if (month === 12 && !hebrewLeap(year)) {
    return 29;
  }

  if (month === 8 && !(mod(hebrewYearDays(year), 10) === 5)) {
    return 29;
  }

  if (month === 9 && mod(hebrewYearDays(year), 10) === 3) {
    return 29;
  }

  return 30;
}

function hebrewToJd(year, month, day) {
  let mon;

  const months = hebrewYearMonths(year);
  let jd =
    HEBREW_EPOCH +
    calculateHebrewYearStartDelay(year) +
    calculateHebrewYearAdjacentDelay(year) +
    day +
    1;

  if (month < 7) {
    for (mon = 7; mon <= months; mon++) {
      jd += hebrewMonthDays(year, mon);
    }
    for (mon = 1; mon < month; mon++) {
      jd += hebrewMonthDays(year, mon);
    }
  } else {
    for (mon = 7; mon < month; mon++) {
      jd += hebrewMonthDays(year, mon);
    }
  }

  return jd;
}

function jdToHebrew(julianDate) {
  let year;
  let month;

  const jd = Math.floor(julianDate) + 0.5;
  const count = Math.floor(
    ((jd - HEBREW_EPOCH) * 98496.0) / 35975351.0,
  );
  year = count - 1;
  for (let i = count; jd >= hebrewToJd(i, 7, 1); i++) {
    year++;
  }
  const first = jd < hebrewToJd(year, 1, 1) ? 7 : 1;
  month = first;
  for (let i = first; jd > hebrewToJd(year, i, hebrewMonthDays(year, i)); i++) {
    month++;
  }
  const day = jd - hebrewToJd(year, month, 1) + 1;
  return [year, month, day];
}

const JewishMonth = {
    None: "None",
    Tishri: "Tishri",
    Cheshvan: "Cheshvan",
    Kislev: "Kislev",
    Tevet: "Tevet",
    Shevat: "Shevat",
    Adar: "Adar",
    Nisan: "Nisan",
    Iyyar: "Iyyar",
    Sivan: "Sivan",
    Tammuz: "Tammuz",
    Av: "Av",
    Elul: "Elul",
    AdarI: "AdarI",
    AdarII: "AdarII"
};

function isLeapYear(year) {
  const yearIndex = year % 19;
  return (
    yearIndex === 0 ||
    yearIndex === 3 ||
    yearIndex === 6 ||
    yearIndex === 8 ||
    yearIndex === 11 ||
    yearIndex === 14 ||
    yearIndex === 17
  );
};

function getJewishMonthByIndex(index, jewishYear) {
  const jewishMonths = [
    JewishMonth.None,
    JewishMonth.Nisan,
    JewishMonth.Iyyar,
    JewishMonth.Sivan,
    JewishMonth.Tammuz,
    JewishMonth.Av,
    JewishMonth.Elul,
    JewishMonth.Tishri,
    JewishMonth.Cheshvan,
    JewishMonth.Kislev,
    JewishMonth.Tevet,
    JewishMonth.Shevat,
    JewishMonth.Adar,
    JewishMonth.AdarII,
  ];

  const month = jewishMonths[index] || JewishMonth.None;
  if (month === JewishMonth.Adar && isLeapYear(jewishYear)) {
    return JewishMonth.AdarI;
  }
  return month;
};

function getJewishMonthsInOrder(year) {
  const jewishMonthsInOrder = [
    JewishMonth.None,
    JewishMonth.Tishri,
    JewishMonth.Cheshvan,
    JewishMonth.Kislev,
    JewishMonth.Tevet,
    JewishMonth.Shevat,
    JewishMonth.AdarI,
    JewishMonth.AdarII,
    JewishMonth.Nisan,
    JewishMonth.Iyyar,
    JewishMonth.Sivan,
    JewishMonth.Tammuz,
    JewishMonth.Av,
    JewishMonth.Elul,
  ];
  if (isLeapYear(year)) {
    return jewishMonthsInOrder;
  }

  return jewishMonthsInOrder
    .filter((month) => month !== "AdarII")
    .map((month) => {
      if (month === "AdarI") {
        return "Adar";
      }

      return month;
    });
};

export function toJewishDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd2 = gregorianToJd(year, month, day);
  const jewishDateArr = jdToHebrew(jd2);

  const jewishYear = jewishDateArr[0];
  const jewishMonthName = getJewishMonthByIndex(jewishDateArr[1], jewishYear);
  const jewishMonth = getJewishMonthsInOrder(jewishYear).findIndex(
    (i) => i === jewishMonthName,
  );
  const JewishDate = {
    year: jewishYear,
    monthName: jewishMonthName,
    month: jewishMonth,
    day: jewishDateArr[2],
  };
  return JewishDate;
};

export function formatJewishDateInHebrew(date, withYear = true) {
    const jewishDate = toJewishDate(date);
    if (withYear) {
        return `${jewishDate.day} ${jewishDate.monthName} ${jewishDate.year}`;
    } else {
        return `${jewishDate.day} ${jewishDate.monthName}`;
    }
}
