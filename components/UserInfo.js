const UserInfo = ({ userInfo }) => {
  return (
    <div className="flex flex-col justify-center items-center mt-4 text-sm space-y-2">
      {userInfo && (
        <img
          src={userInfo.avatar}
          className="w-12 h-12 border-[1px] border-gray-200 inline-block mr-2"
        />
      )}
      {userInfo && <span> {userInfo.full_name}</span>}
    </div>
  );
};

export default UserInfo;
