import { TeacherNearbyTable, TeacherStudentTable } from "../../../../components/teacher-demo/teacher-student-table";

export default async function TeacherLandingPage() {
  return (
    <div className="space-y-5">
      <TeacherNearbyTable />
      <TeacherStudentTable />
    </div>
  );
}
