import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => (
  <div className="flex justify-center py-12">
    <UserProfile path="/user-profile" />
  </div>
);
export default UserProfilePage;
