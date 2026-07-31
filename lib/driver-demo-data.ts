export type DriverStudentRecord = {
  id: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  gradeLevel: string;
  className: string;
  distanceKm: number;
  homeAddress: string;
  homeLatitude: number;
  homeLongitude: number;
  pickupStatus: "On Car" | "Delivered" | "Pending";
};

export type DriverTripSummary = {
  totalStudents: number;
  onCarCount: number;
  deliveredCount: number;
  remainingDistanceKm: number;
  etaMinutes: number;
  vehiclePlat: string;
  driverName: string;
  shiftLabel: string;
};

const studentSeeds: Array<
  [
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    number,
    number,
    DriverStudentRecord["pickupStatus"]
  ]
> = [
  [
    "Alya Khairunnisa",
    "Ibu Siti Rahayu",
    "0812-1001-2233",
    "SD",
    "Kelas 3A",
    0.4,
    "Jl. Melati No. 12, Cimindi",
    -6.8712,
    107.5823,
    "On Car"
  ],
  [
    "Raka Pradana",
    "Bpk. Dedi Supriatna",
    "0813-2002-3344",
    "SMP",
    "Kelas 8B",
    0.9,
    "Jl. Cikutra No. 45, Bandung",
    -6.8821,
    107.6032,
    "On Car"
  ],
  [
    "Nabila Putri Azzahra",
    "Ibu Rina Marlina",
    "0821-3003-4455",
    "SMA",
    "Kelas 11 IPA 2",
    1.3,
    "Jl. Dago Asri No. 8, Coblong",
    -6.889,
    107.6156,
    "On Car"
  ],
  [
    "Arka Mahendra",
    "Bpk. Joko Santoso",
    "0852-4004-5566",
    "TK",
    "TK B Kelompok Ceria",
    1.8,
    "Jl. Buah Batu No. 77, Dayeuhkolot",
    -6.9421,
    107.643,
    "On Car"
  ],
  [
    "Syifa Humaira",
    "Ibu Dewi Sartika",
    "0812-5005-6677",
    "SD",
    "Kelas 5C",
    2.1,
    "Jl. Peta Barat No. 21, Andir",
    -6.9123,
    107.5899,
    "On Car"
  ],
  [
    "Fathan Rayhan",
    "Bpk. Hendra Gunawan",
    "0813-6006-7788",
    "SMP",
    "Kelas 7A",
    2.7,
    "Jl. Aceh No. 32, Sumur Bandung",
    -6.9044,
    107.6099,
    "On Car"
  ],
  [
    "Queena Larasati",
    "Ibu Maya Angelina",
    "0821-7007-8899",
    "SMA",
    "Kelas 10 IPS 1",
    3.2,
    "Jl. RE. Martadinata No. 55, Cihampelas",
    -6.8977,
    107.5988,
    "Delivered"
  ],
  [
    "Irfan Hidayatullah",
    "Bpk. Taufik Hidayat",
    "0852-8008-9900",
    "SD",
    "Kelas 6A",
    3.8,
    "Jl. Dr. Setiabudi No. 110, Sukajadi",
    -6.8789,
    107.5945,
    "On Car"
  ],
  [
    "Aisyah Nurfadillah",
    "Ibu Nia Kurnia",
    "0812-9009-0011",
    "TK",
    "TK A Kelompok Matahari",
    4.3,
    "Jl. Sudirman No. 125, Kebon Kawung",
    -6.9211,
    107.6011,
    "On Car"
  ],
  [
    "Muhammad Zayan",
    "Bpk. Adi Wijaya",
    "0813-1010-1122",
    "SMP",
    "Kelas 9C",
    5.1,
    "Jl. Pasirkaliki No. 200, Antapani",
    -6.9166,
    107.638,
    "Delivered"
  ],
  [
    "Cinta Maharani",
    "Ibu Sari Permata",
    "0821-1111-2233",
    "SMA",
    "Kelas 12 IPA 3",
    6.4,
    "Jl. Soekarno Hatta No. 398, Bojongloa",
    -6.934,
    107.568,
    "On Car"
  ],
  [
    "Gibran Alfarezi",
    "Bpk. Ridwan Hakim",
    "0852-1212-3344",
    "SD",
    "Kelas 2B",
    7.9,
    "Jl. Leuwi Panjang No. 88, Cibeunying",
    -6.8998,
    107.655,
    "On Car"
  ]
];

export function formatCompanyName(companySlug: string): string {
  return decodeURIComponent(companySlug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDriverTripSummary(companySlug: string): DriverTripSummary {
  const companyName = formatCompanyName(companySlug);
  return {
    totalStudents: studentSeeds.length,
    onCarCount: studentSeeds.filter((seed) => seed[9] === "On Car").length,
    deliveredCount: studentSeeds.filter((seed) => seed[9] === "Delivered").length,
    remainingDistanceKm: 18.4,
    etaMinutes: 37,
    vehiclePlat: `${companyName.slice(0, 2).toUpperCase()} 1807 SKD`,
    driverName: "Pak Ade Sutisna",
    shiftLabel: "Pulang Sore · Shift 2"
  };
}

export function getDriverStudentRecords(sortType: "nearest-first" | "farthest-first" = "nearest-first") {
  const records: DriverStudentRecord[] = studentSeeds.map((seed, index) => ({
    id: `student-${index + 1}`,
    studentName: seed[0],
    parentName: seed[1],
    parentPhone: seed[2],
    gradeLevel: seed[3],
    className: seed[4],
    distanceKm: seed[5],
    homeAddress: seed[6],
    homeLatitude: seed[7],
    homeLongitude: seed[8],
    pickupStatus: seed[9]
  }));

  if (sortType === "nearest-first") {
    records.sort((left, right) => left.distanceKm - right.distanceKm);
  } else {
    records.sort((left, right) => right.distanceKm - left.distanceKm);
  }

  return records;
}

export function buildGoogleMapsUrl(latitude: number, longitude: number, label: string): string {
  const destination = `${latitude},${longitude}`;
  const query = encodeURIComponent(label);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id&query=${query}`;
}

export function buildPhoneCallUrl(phone: string): string {
  const digitsOnly = phone.replace(/[^\d+]/g, "");
  return `tel:${digitsOnly.startsWith("0") ? digitsOnly.replace(/^0/, "+62") : digitsOnly}`;
}

export function getDriverCompanyMeta(companySlug: string) {
  const companyName = formatCompanyName(companySlug);
  return {
    companySlug: decodeURIComponent(companySlug),
    schoolName: `${companyName} EduCore Academy`,
    tagline: "Aplikasi driver antar jemput sekolah yang cepat, aman, dan terintegrasi.",
    primaryColor: "#166534",
    secondaryColor: "#0f172a",
    accentColor: "#d97706",
    stats: getDriverTripSummary(companySlug)
  };
}
