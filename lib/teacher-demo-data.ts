export type TeacherPickupStatus = "Picked Up" | "Waiting" | "Overdue";

export type TeacherStudentRecord = {
  id: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  homeAddress: string;
  gradeLevel: string;
  className: string;
  pickupStatus: TeacherPickupStatus;
  pickupTimeLabel: string;
  expectedPickupLabel: string;
  overdueMinutes: number;
};

export type NearbyPickup = {
  id: string;
  pickupName: string;
  pickupRelation: "Orang Tua" | "Kakak" | "Supir Antar Jemput" | "Lainnya";
  vehiclePlat?: string;
  vehicleInfo?: string;
  distanceMeters: number;
  etaMinutes: number;
  phone: string;
  studentsInCharge: string[];
};

export type TeacherClassInfo = {
  className: string;
  gradeLevel: string;
  totalStudents: number;
  homeroomTeacher: string;
  homeroomTeacherPhone: string;
  schoolName: string;
  pickupWindowLabel: string;
  nowLabel: string;
};

const nearPickupSeeds: Array<
  [
    string,
    NearbyPickup["pickupRelation"],
    string | undefined,
    string | undefined,
    number,
    number,
    string,
    string[]
  ]
> = [
  [
    "Ibu Siti Rahayu",
    "Orang Tua",
    undefined,
    "Honda Beat Merah",
    55,
    2,
    "0812-1001-2233",
    ["Alya Khairunnisa"]
  ],
  [
    "Bpk. Dedi Supriatna",
    "Orang Tua",
    "D 1234 RPL",
    "Toyota Avanza Silver",
    95,
    3,
    "0813-2002-3344",
    ["Raka Pradana"]
  ],
  [
    "Pak Ade Sutisna",
    "Supir Antar Jemput",
    "CO 1807 SKD",
    "Suzuki Carry Pickup",
    135,
    4,
    "0811-3003-4455",
    ["Nabila Putri Azzahra", "Fathan Rayhan"]
  ],
  [
    "Kakak Nabila",
    "Kakak",
    undefined,
    "Vario 150 Putih",
    170,
    5,
    "0813-7007-1234",
    ["Arka Mahendra"]
  ]
];

const studentSeeds: Array<
  [
    string,
    string,
    string,
    string,
    TeacherPickupStatus,
    string,
    string,
    number
  ]
> = [
  [
    "Alya Khairunnisa",
    "Ibu Siti Rahayu",
    "0812-1001-2233",
    "Jl. Melati No. 12, Cimindi",
    "Waiting",
    "-",
    "15.30",
    0
  ],
  [
    "Raka Pradana",
    "Bpk. Dedi Supriatna",
    "0813-2002-3344",
    "Jl. Cikutra No. 45, Bandung",
    "Picked Up",
    "15.28",
    "15.30",
    0
  ],
  [
    "Nabila Putri Azzahra",
    "Ibu Rina Marlina",
    "0821-3003-4455",
    "Jl. Dago Asri No. 8, Coblong",
    "Waiting",
    "-",
    "15.30",
    0
  ],
  [
    "Arka Mahendra",
    "Bpk. Joko Santoso",
    "0852-4004-5566",
    "Jl. Buah Batu No. 77, Dayeuhkolot",
    "Overdue",
    "-",
    "15.30",
    22
  ],
  [
    "Syifa Humaira",
    "Ibu Dewi Sartika",
    "0812-5005-6677",
    "Jl. Peta Barat No. 21, Andir",
    "Picked Up",
    "15.25",
    "15.30",
    0
  ],
  [
    "Fathan Rayhan",
    "Bpk. Hendra Gunawan",
    "0813-6006-7788",
    "Jl. Aceh No. 32, Sumur Bandung",
    "Waiting",
    "-",
    "15.30",
    0
  ],
  [
    "Queena Larasati",
    "Ibu Maya Angelina",
    "0821-7007-8899",
    "Jl. RE. Martadinata No. 55, Cihampelas",
    "Picked Up",
    "15.22",
    "15.30",
    0
  ],
  [
    "Irfan Hidayatullah",
    "Bpk. Taufik Hidayat",
    "0852-8008-9900",
    "Jl. Dr. Setiabudi No. 110, Sukajadi",
    "Overdue",
    "-",
    "15.30",
    14
  ],
  [
    "Aisyah Nurfadillah",
    "Ibu Nia Kurnia",
    "0812-9009-0011",
    "Jl. Sudirman No. 125, Kebon Kawung",
    "Waiting",
    "-",
    "15.30",
    0
  ],
  [
    "Muhammad Zayan",
    "Bpk. Adi Wijaya",
    "0813-1010-1122",
    "Jl. Pasirkaliki No. 200, Antapani",
    "Picked Up",
    "15.20",
    "15.30",
    0
  ],
  [
    "Cinta Maharani",
    "Ibu Sari Permata",
    "0821-1111-2233",
    "Jl. Soekarno Hatta No. 398, Bojongloa",
    "Overdue",
    "-",
    "15.30",
    31
  ],
  [
    "Gibran Alfarezi",
    "Bpk. Ridwan Hakim",
    "0852-1212-3344",
    "Jl. Leuwi Panjang No. 88, Cibeunying",
    "Waiting",
    "-",
    "15.30",
    0
  ]
];

export function formatCompanyName(companySlug: string): string {
  return decodeURIComponent(companySlug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getTeacherClassInfo(companySlug: string): TeacherClassInfo {
  const companyName = formatCompanyName(companySlug);
  return {
    className: "Kelas 3A",
    gradeLevel: "SD",
    totalStudents: studentSeeds.length,
    homeroomTeacher: "Ibu Wiwin Susilawati, S.Pd.",
    homeroomTeacherPhone: "0811-8888-1234",
    schoolName: `${companyName} EduCore Academy`,
    pickupWindowLabel: "Jam jemput 15.30 - 16.00",
    nowLabel: "Rabu, 29 Jul 2026 · 15.43 WIB"
  };
}

export function getNearbyPickups(maxDistanceMeters: number = 200): NearbyPickup[] {
  return nearPickupSeeds
    .filter((seed) => seed[4] <= maxDistanceMeters)
    .sort((left, right) => left[4] - right[4])
    .map((seed, index) => ({
      id: `pickup-near-${index + 1}`,
      pickupName: seed[0],
      pickupRelation: seed[1],
      vehiclePlat: seed[2],
      vehicleInfo: seed[3],
      distanceMeters: seed[4],
      etaMinutes: seed[5],
      phone: seed[6],
      studentsInCharge: seed[7]
    }));
}

export function getTeacherStudentRecords(): TeacherStudentRecord[] {
  return studentSeeds.map((seed, index) => {
    const status = seed[4];
    const overdueMinutes = status === "Overdue" ? seed[7] : 0;
    return {
      id: `t-student-${index + 1}`,
      studentName: seed[0],
      parentName: seed[1],
      parentPhone: seed[2],
      homeAddress: seed[3],
      pickupStatus: seed[4],
      pickupTimeLabel: seed[5],
      expectedPickupLabel: seed[6],
      overdueMinutes,
      gradeLevel: "SD",
      className: "Kelas 3A"
    };
  });
}

export function buildPhoneCallUrl(phone: string): string {
  const digitsOnly = phone.replace(/[^\d+]/g, "");
  return `tel:${digitsOnly.startsWith("0") ? digitsOnly.replace(/^0/, "+62") : digitsOnly}`;
}

export function getTeacherCompanyMeta(companySlug: string) {
  const companyName = formatCompanyName(companySlug);
  return {
    companySlug: decodeURIComponent(companySlug),
    schoolName: `${companyName} EduCore Academy`,
    tagline: "Dashboard guru wali kelas: kelola penjemputan siswa dengan cepat dan aman.",
    primaryColor: "#6d28d9",
    secondaryColor: "#0f172a",
    accentColor: "#dc2626"
  };
}

export function getPickupStatusLabel(status: TeacherPickupStatus) {
  switch (status) {
    case "Picked Up":
      return "Sudah Dijemput";
    case "Waiting":
      return "Menunggu";
    case "Overdue":
      return "Melebihi Jam Pulang";
  }
}
