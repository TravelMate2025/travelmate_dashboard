"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import env from "@/config/env";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteIcon, RemoveFormattingIcon, SearchIcon, X } from "lucide-react";
import Loading from "../../loading";
import { showErrorToast } from "@/utils/toasters";
import { assignUserToRole, fetchRoles, removeUsersFromRole } from "@/services/admin";

type AssignedUser = {
  id: number;
  email: string;
  name: string;
};
type Roles = {
  id: string;
  name: string;
  assigned_users: AssignedUser[];
};

const ManageUsers = () => {
  const [defaultTab, setDefaultTab] = useState("addNewUser");
  const route = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [addUSerModal, setIsAddUserModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // New state for "Remove Existing Users" modals
  const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);
  const [showSuccessRemoveModal, setShowSuccessRemoveModal] = useState(false);

  const params = useParams();
  const roleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Roles[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const [selectedUserIdRemove, setSelectedUserIdRemove] = useState<number[]>(
    []
  );
  const [isLoadRemove, setIsLoadRemove] = useState(false);
  const [isLoadAdd, setIsLoadAdd] = useState(false);

  const currentRole = roles.find((role) => String(role.id) === String(roleId));

  const handleSelectAdd = (userId: number) => {
    setSelectedUserIds((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };
  const handleSelectRemove = (userId: number) => {
    setSelectedUserIdRemove((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await fetchRoles();
      setRoles(response.data.results || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  const usersAssignedToOtherRoles = roles
    .filter(
      (role) =>
        String(role.id) !== String(roleId) && role.name !== "Super Admin"
    )
    .flatMap((role) =>
      role.assigned_users.map((user) => ({
        ...user,
        roleName: role.name,
      }))
    );

  const addUsersToRole = async () => {
    const emailsToAdd = usersAssignedToOtherRoles
      .filter((user) => selectedUserIds.includes(user.id))
      .map((user) => user.email.trim());
    try {
      setIsLoadAdd(true);
      await assignUserToRole(roleId, { email: emailsToAdd.join(",") });
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      setSelectedUserIds([]);
      await fetchRoles();
    } catch (error: any) {
      console.log(error);
      showErrorToast({
        message: error?.response?.data?.message || "Failed to add users.",
      });
    } finally {
      setIsLoadAdd(false);
    }
  };

  const removeExistingUsers = async () => {
    const emailsToRemove = roles
      .filter((role) => String(role.id) === String(roleId))
      .flatMap((role) =>
        role.assigned_users
          .filter((user) => selectedUserIdRemove.includes(user.id))
          .map((user) => user.email.trim())
      );
    try {
      setIsLoadRemove(true);
      await removeUsersFromRole(roleId, { email: emailsToRemove.join(",") });
      setShowConfirmRemoveModal(false);
      setShowSuccessRemoveModal(true);
      setSelectedUserIdRemove([]);
      await fetchRoles();
    } catch (error: any) {
      console.log(error);
      showErrorToast({
        message: error?.response?.data?.message || "Failed to remove users.",
      });
    } finally {
      setIsLoadRemove(false);
    }
  };
  useEffect(() => {
    if (showSuccessModal || showSuccessRemoveModal) {
      const timeout = setTimeout(() => {
        setShowSuccessModal(false);
        setShowSuccessRemoveModal(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  });

  //SEARCH USERS TO ADD
  const handleSearch = (e: any) => {
    setSearchQuery(e.target.value);
  };
  return (
    <div className="flex min-h-screen bg-background rounded-lg">
      <main className="w-full">
        <div className="rounded-lg bg-card md:px-5 px-0 pt-5">
          <div className="flex items-center justify-normal lg:gap-72 gap-32 mb-5">
            <Image
              src="/assets/icons/arrow-back.svg"
              alt="arrow-back"
              width={20}
              height={20}
              className="font-bold cursor-pointer"
              onClick={() => route.back()}
            />
            <h1 className="text-lg font-bold text-center ">Manage User</h1>
          </div>
          <Tabs
            defaultValue="addNewUser"
            className="space-y-6"
            onValueChange={setDefaultTab}
          >
            <TabsList className="w-full border-b rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger
                value="addNewUser"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 cursor-pointer"
              >
                Add New User
              </TabsTrigger>

              <TabsTrigger
                value="removeExistingUser"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 cursor-pointer"
              >
                Remove Existing User
              </TabsTrigger>
            </TabsList>

            <TabsContent value="addNewUser" className="space-y-4 px-3">
              <div>
                <p>Assign user from another role</p>
                <div onClick={() => setIsAddUserModal(true)}>
                  <button className="w-full p-2 py-3 rounded-[8px] space-x-4 mt-3 border-[#9b9ea4] border-[1px] flex justify-between bg-transparent">
                    <span>
                      {selectedUserIds.length > 0
                        ? `${selectedUserIds.length} user${
                            selectedUserIds.length > 1 ? "s" : ""
                          } selected`
                        : "Select User"}
                    </span>

                    <img
                      src="/assets/icons/arrow-down.svg"
                      alt=""
                      className="w-3 h-3 ml-auto mt-2 mr-2"
                    />
                  </button>
                </div>
                <Dialog open={addUSerModal} onOpenChange={setIsAddUserModal}>
                  <DialogContent className="fixed md:top-[10vh] top-[20vh] left-1/2 max-w-2xl mt-64 mb-64 overflow-y-auto w-[90vw] max-h-[85vh]">
                    <DialogHeader>
                      <DialogTitle></DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-4 py-10">
                        <div className="flex justify-normal items-center relative">
                          <SearchIcon className="w-5 absolute left-3" />
                          <input
                            type="search"
                            className="w-full border border-black rounded-lg p-2 pl-10"
                            placeholder="Search Users"
                            value={searchQuery}
                            onChange={handleSearch}
                          />
                        </div>

                        {loading ? (
                          <Loading />
                        ) : (
                          <div className="space-y-4">
                            {usersAssignedToOtherRoles.length === 0 ? (
                              <p className="text-center text-gray-500">
                                No users available to add.
                              </p>
                            ) : (
                              usersAssignedToOtherRoles
                                .filter(
                                  (user) =>
                                    user.email
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    user.email
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase())
                                )
                                .map((user, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between w-full lg:items-center items-start py-2 border-b"
                                  >
                                    <div className="flex justify-normal items-center gap-10">
                                      <input
                                        type="checkbox"
                                        name={`add-${user.id}`}
                                        aria-label={`Add user ${user.email}`}
                                        title={`Add user ${user.email}`}
                                        checked={selectedUserIds.includes(
                                          user.id
                                        )}
                                        onChange={() =>
                                          handleSelectAdd(user.id)
                                        }
                                      />

                                      <div>
                                        <p>{user.name || "Unkownn user"}</p>
                                        <p className="text-muted-foreground">
                                          {user.email}
                                        </p>
                                      </div>
                                    </div>

                                    <p className="text-blue-500 text-nowrap lg:text-base text-xs">
                                      {user.roleName}
                                    </p>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex justify-normal gap-5 items-start">
                  {selectedUserIds.length
                    ? usersAssignedToOtherRoles
                        .filter((user) => selectedUserIds.includes(user.id))
                        .map((user, index) => (
                          <div
                            key={index}
                            className="flex justify-normal items-center align-middle gap-4 bg-[#F5F5F5] p-2 mt-4 w-fit"
                          >
                            <p>{user.name}</p>
                            <X
                              fontSize={2}
                              className="w-4 h-4 mt-[2px] cursor-pointer"
                              onClick={() =>
                                setSelectedUserIds((prev) =>
                                  prev.filter((id) => id !== user.id)
                                )
                              }
                            />
                          </div>
                        ))
                    : null}
                </div>

                <Button
                  onClick={() => setShowConfirmModal(true)}
                  className="bg-[#023E8A] hover:bg-blue-800 cursor-pointer mt-24 w-full text-center"
                >
                  Add
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="removeExistingUser" className="space-y-8 px-3">
              <div>
                <p className="font-bold">Select Users to remove</p>
                {roles
                  .filter((role) => String(role.id) === String(roleId))
                  .flatMap((role) => role.assigned_users)
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center py-3 w-full"
                    >
                      <div>
                        <p>{user.name}</p>
                        <p>{user.email}</p>
                      </div>
                      <input
                        type="checkbox"
                        name={`remove-${user.id}`}
                        id={`remove-${user.id}`}
                        aria-label={`Remove user ${user.email}`}
                        title={`Remove user ${user.email}`}
                        checked={selectedUserIdRemove?.includes(user.id)}
                        onChange={() => handleSelectRemove(user.id)}
                      />
                    </div>
                  ))}
                <Button
                  onClick={() => setShowConfirmRemoveModal(true)}
                  className="bg-[#D72638] hover:bg-red-800 cursor-pointer mt-24 w-full text-center"
                  disabled={selectedUserIdRemove.length < 1}
                >
                  Remove
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Confirm Member Transfer Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="w-full lg:max-w-lg max-w-sm p-4">
            <div className="lg:space-y-[40px] space-y-3 flex flex-col items-center">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-bold text-[#181818]">
                  Confirm Member Transfer?
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="lg:text-base text-[12px] text-gray-700 text-left px-4 font-[500]">
                You are about to add {selectedUserIds.length} selected user
                {selectedUserIds.length > 1 && `s`} to this role. These users
                will be removed from their current roles. Do you want to
                proceed?
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 justify-end lg:pt-5 pt-2">
              <Button
                className="border text-black border-[#023E8A] p-2 bg-transparent hover:bg-transparent cursor-pointer"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  addUsersToRole();
                }}
                className="bg-[#023E8A] p-2 px-4 hover:bg-blue-700 cursor-pointer"
              >
                {isLoadAdd && (
                  <LoaderCircleIcon
                    stroke="#ffffff"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
                Yes, Proceed
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal for Adding New User */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="w-full lg:max-w-sm max-w-sm p-8">
            <div className="flex flex-col items-center">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-[500] text-[#181818]">
                  Success
                </DialogTitle>
              </DialogHeader>
              <img
                src="/assets/icons/blue-success.svg"
                alt="Success"
                className="w-20 h-20 my-6"
              />
              <DialogDescription className="lg:text-lg text-[14px] text-gray-700 text-center px-4 font-bold">
                User Added Successfully
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Remove Users Modal */}
        <Dialog
          open={showConfirmRemoveModal}
          onOpenChange={setShowConfirmRemoveModal}
        >
          <DialogContent className="w-full lg:max-w-lg max-w-sm p-4">
            <div className="space-y-[40px] flex flex-col items-center">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-bold text-[#181818]">
                  Confirm Remove Users?
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="lg:text-base text-[12px] text-gray-700 text-left px-4 font-[500]">
                You are about to remove the selected users from{" "}
                {currentRole?.name} role. They will no longer have access to
                these role permissions. Do you want to proceed?
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 justify-end pt-5">
              <Button
                className="border text-black border-[#023E8A] p-2 bg-transparent hover:bg-transparent cursor-pointer"
                onClick={() => setShowConfirmRemoveModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  removeExistingUsers();
                }}
                className="bg-[#023E8A] p-2 px-4 hover:bg-blue-700 cursor-pointer"
              >
                {isLoadRemove && (
                  <LoaderCircleIcon
                    stroke="#ffffff"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
                Yes, Proceed
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal for Removing Users */}
        <Dialog
          open={showSuccessRemoveModal}
          onOpenChange={setShowSuccessRemoveModal}
        >
          <DialogContent className="w-full lg:max-w-sm max-w-sm p-8">
            <div className="flex flex-col items-center">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-[500] text-[#181818]"></DialogTitle>
              </DialogHeader>
              <img
                src="/assets/icons/blue-success.svg"
                alt="Success"
                className="w-20 h-20 my-6"
              />
              <DialogDescription className="lg:text-lg text-[14px] text-gray-700 text-center px-4 font-bold">
                Users Removed Successfully
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ManageUsers;
