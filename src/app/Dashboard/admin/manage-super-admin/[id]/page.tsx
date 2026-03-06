"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { DialogHeader } from "@/components/ui/dialog";

// Type for user in assigned_users
type AssignedUser = {
  id: number;
  email: string;
  name: string;
};

// Type for role
type Role = {
  id: string;
  name: string;
  assigned_users: AssignedUser[];
};

type SuperAdmin = {
  name: string;
  email: string;
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showErrorToast } from "@/utils/toasters";
import { LoaderCircleIcon } from "lucide-react";
import { fetchRoles, inviteSupes, transferSupes } from "@/services/admin";

const normalizeRoleName = (value?: string | null) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const ManageSuperAdmin = () => {
  const [defaultTab, setDefaultTab] = useState("addNewUser");
  const route = useRouter();

  const [isLoadInvite, setIsLoadInvite] = useState(false);
  const [isLoadTransfer, setIsLoadTransfer] = useState(false);

  const [roles, setRoles] = useState<Role[]>([]);

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const [selectedInviteRoleId, setSelectedInviteRoleId] = useState<
    string | null
  >(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmInviteModal, setShowConfirmInviteModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSuccessInviteModal, setShowSuccessInviteModal] = useState(false);

  const [actionTransferOption, setActionTransferOption] = useState("");
  const [changeRoleTransfer, setChangeRoleTransfer] = useState(false);

  const [actionInviteOption, setActionInviteOption] = useState("");
  const [changeRoleInvite, setChangeRoleInvite] = useState(false);

  const [newSuperAdmin, setNewSuperAdmin] = useState<SuperAdmin>({
    name: "",
    email: "",
  });

  const fetchRole = async () => {
    try {
      const response = await fetchRoles();
      setRoles(response.data.results || []);
    } catch (error) {
      // handle error
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  const adminRoles = roles.filter(
    (role) => normalizeRoleName(role.name) !== "super admin"
  );

  const transferSuperAdminRole = async () => {
    try {
      const payload = {
        email:
          adminRoles
            .find((role) =>
              role.assigned_users.some((user) => user.id === selectedUserIds[0])
            )
            ?.assigned_users.find((user) => user.id === selectedUserIds[0])
            ?.email ?? "",
        transfer_action: actionTransferOption ?? "",
        new_role_id: selectedRoleId ?? "",
      };
      setIsLoadTransfer(true);
      await transferSupes(payload);
      await fetchRoles();
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      setTimeout(() => route.push("/auth/login"), 3000);
    } catch (error: any) {
      console.log(error);
      showErrorToast({
        message: error?.response?.data?.message || "Cannot transfer role",
      });
    } finally {
      setIsLoadTransfer(false);
    }
  };

  const InviteSuperAdmin = async () => {
    try {
      const payload = {
        email: newSuperAdmin.email ?? "",
        name: newSuperAdmin.name ?? "",
        transfer_action: actionInviteOption ?? "",
        new_role_id: selectedInviteRoleId ?? "",
      };
      setIsLoadInvite(true);
      await inviteSupes(payload);
      await fetchRoles();
      setShowSuccessInviteModal(true);
      setTimeout(() => route.push("/auth/login"), 3000);
    } catch (error: any) {
      console.log(error);
      showErrorToast({
        message: error?.response?.data?.message || "Cannot Invite member",
      });
    } finally {
      setIsLoadInvite(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background rounded-lg">
      {/* Main Content */}
      <main className="w-full px-3">
        <div className="rounded-lg bg-card md:px-5 px-0 pt-5">
          <div className="flex items-center justify-normal lg:gap-72 gap-3 mb-5">
            <Image
              src="/assets/icons/arrow-back.svg"
              alt="arrow-back"
              width={20}
              height={20}
              className="font-bold cursor-pointer"
              onClick={() => route.back()}
            />
            <h1 className=" font-bold text-center ">Manage Super Admin role</h1>
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
                Transfer to existing user
              </TabsTrigger>

              <TabsTrigger
                value="removeExistingUser"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 cursor-pointer"
              >
                Invite new user
              </TabsTrigger>
            </TabsList>

            <TabsContent value="addNewUser" className="space-y-4">
              <div>
                <p>Select user to transfer super admin privileges to</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div>
                      <button className="w-full p-2 py-3 rounded-[8px] space-x-4 mt-3 border-[#9b9ea4] border-[1px] flex justify-between bg-transparent">
                        <span>
                          {selectedUserIds.length > 0
                            ? adminRoles
                                .find((role) =>
                                  role.assigned_users.some(
                                    (user) => user.id === selectedUserIds[0]
                                  )
                                )
                                ?.assigned_users.find(
                                  (user) => user.id === selectedUserIds[0]
                                )?.name
                            : "Select User"}
                        </span>

                        <img
                          src="/assets/icons/arrow-down.svg"
                          alt=""
                          className="w-3 h-3 ml-auto mt-2 mr-2"
                        />
                      </button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
                  >
                    <div>
                      <DropdownMenuItem>
                        <div className="w-full">
                          {adminRoles.length === 0 ? (
                            <p className="text-center text-gray-500">
                              No users available to add.
                            </p>
                          ) : (
                            adminRoles.map((admin) =>
                              admin.assigned_users.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex justify-between w-full items-center py-2"
                                  onClick={() => setSelectedUserIds([user.id])}
                                >
                                  <div className="flex justify-normal items-center gap-10 w-full">
                                    <p>{user.name || "Name"}</p>
                                    {/* <p className="text-muted-foreground">
                                          {user.email}
                                        </p> */}
                                  </div>

                                  <p className="text-blue-500 text-nowrap lg:text-base text-xs">
                                    {admin.name || "Role Name"}
                                  </p>
                                </div>
                              ))
                            )
                          )}
                        </div>
                        {/* )} */}
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="pt-5">
                  <p>After transfer, select what happens to your account</p>
                  <div className="flex w-full justify-normal lg:flex-row flex-col lg:items-center gap-4 mt-3">
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="option"
                        value="change_role"
                        id="change-role"
                        onChange={(e) => {
                          setChangeRoleTransfer(true);
                          setActionTransferOption(e.target.value);
                        }}
                      />
                      <label htmlFor="change-role">Change my role</label>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="option"
                        value="remove_access"
                        id="remove-access"
                        onChange={(e) => {
                          setChangeRoleTransfer(false);
                          setActionTransferOption(e.target.value);
                        }}
                      />
                      <label htmlFor="remove-access">
                        Remove my access completely
                      </label>
                    </div>
                  </div>
                  {changeRoleTransfer && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div>
                          <button className="w-full p-2 py-3 rounded-[8px] space-x-4 mt-3 border-[#9b9ea4] border-[1px] flex justify-between bg-transparent">
                            <span>
                              {selectedRoleId
                                ? adminRoles.find(
                                    (role) => role.id === selectedRoleId
                                  )?.name
                                : "Select Role"}
                            </span>

                            <img
                              src="/assets/icons/arrow-down.svg"
                              alt=""
                              className="w-3 h-3 ml-auto mt-2 mr-2"
                            />
                          </button>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
                      >
                        {adminRoles.length === 0 ? (
                          <p className="text-center text-gray-500">
                            No roles available.
                          </p>
                        ) : (
                          adminRoles.map((role, index) => (
                            <DropdownMenuItem
                              key={index}
                              className="w-full text-center px-4 py-2 hover:bg-gray-200"
                              onClick={() => setSelectedRoleId(role.id)}
                            >
                              {role.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <Button
                  disabled={
                    isLoadTransfer ||
                    selectedUserIds.length === 0 ||
                    !actionTransferOption ||
                    (changeRoleTransfer && !selectedRoleId)
                  }
                  onClick={() => setShowConfirmModal(true)}
                  className={`
               hover:bg-blue-800 cursor-pointer mt-24 w-full text-center`}
                >
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="removeExistingUser" className="space-y-8">
              <div>
                <p className="font-bold">Add New Super Admin Information</p>
                <div className="flex justify-between items-center py-3 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <p className="font-semibold">Name</p>
                    <input
                      type="text"
                      value={newSuperAdmin.name}
                      onChange={(e) =>
                        setNewSuperAdmin({
                          ...newSuperAdmin,
                          name: e.target.value,
                        })
                      }
                      name="name"
                      aria-label="Super admin name"
                      title="Super admin name"
                      placeholder="Enter full name"
                      className="border border-black rounded-md p-2 w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <p className="font-semibold">Email Address</p>
                    <input
                      type="email"
                      value={newSuperAdmin.email}
                      name="email"
                      onChange={(e) =>
                        setNewSuperAdmin({
                          ...newSuperAdmin,
                          email: e.target.value,
                        })
                      }
                      aria-label="Super admin email"
                      title="Super admin email"
                      placeholder="Enter email address"
                      className="border border-black rounded-md p-2 w-full"
                    />
                  </div>
                </div>
                <div className="">
                  <p>After transfer, select what happens to your account</p>
                  <div className="flex w-full justify-normal lg:flex-row flex-col lg:items-center gap-4 mt-3">
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="transfer"
                        id="transfer-change-role"
                        value="change_role"
                        aria-label="Change my role"
                        title="Change my role"
                        onChange={(e) => {
                          setChangeRoleInvite(true);
                          setActionInviteOption(e.target.value);
                        }}
                      />
                      <label htmlFor="transfer-change-role">Change my role</label>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="transfer"
                        id="transfer-remove-access"
                        value="remove_access"
                        aria-label="Remove my access completely"
                        title="Remove my access completely"
                        onChange={(e) => {
                          setChangeRoleInvite(false);
                          setActionInviteOption(e.target.value);
                        }}
                      />
                      <label htmlFor="transfer-remove-access">
                        Remove my access completely
                      </label>
                    </div>
                  </div>

                  {changeRoleInvite && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full p-2 py-3 rounded-[8px] space-x-4 mt-3 border-[#9b9ea4] border-[1px] flex justify-between bg-transparent">
                          <span>
                            {selectedInviteRoleId
                              ? adminRoles.find(
                                  (role) => role.id === selectedInviteRoleId
                                )?.name
                              : "Select Role"}
                          </span>

                          <img
                            src="/assets/icons/arrow-down.svg"
                            alt=""
                            className="w-4 h-4 ml-auto"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
                      >
                        {adminRoles.map((role, index) => (
                          <DropdownMenuItem
                            key={index}
                            className="w-full text-center px-4 py-2 hover:bg-gray-200"
                            onClick={() => setSelectedInviteRoleId(role.id)}
                          >
                            {role.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <Button
                  disabled={
                    isLoadInvite ||
                    selectedInviteRoleId?.length === 0 ||
                    !actionInviteOption ||
                    (changeRoleInvite && !selectedInviteRoleId)
                  }
                  onClick={() => setShowConfirmInviteModal(true)}
                  className="
                bg-[#023E8A] hover:bg-blue-800 cursor-pointer mt-24 w-full text-center"
                >
                  Send invitation
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Confirm Member Transfer Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="w-full lg:max-w-lg max-w-sm p-4 rounded-lg bg-white shadow-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="lg:space-y-[40px] space-y-3 flex flex-col items-center">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-bold text-[#181818]">
                  Confirm Member Transfer?
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="lg:text-base text-[12px] text-gray-700 text-left px-4 font-[500]">
                You are about to add this selected user to this role. These
                users will be removed from their current roles. Do you want to
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
                  transferSuperAdminRole();
                }}
                className="bg-[#023E8A] p-2 px-4 hover:bg-blue-700 cursor-pointer"
              >
                {isLoadTransfer && (
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

        {/* Confirm Super Admin Invite Modal */}
        <Dialog
          open={showConfirmInviteModal}
          onOpenChange={setShowConfirmInviteModal}
        >
          <DialogContent className="w-full lg:max-w-xl max-w-sm p-8 rounded-lg bg-white shadow-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="space-y-[40px] flex flex-col items-center">
              <DialogHeader className="text-justify">
                <DialogTitle className="text-xl font-bold text-[#181818]  text-justify">
                  Confirm Super Admin Invite?
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="lg:text-base text-[12px] text-gray-700 text-left px-4 font-[500]">
                You are about to invite and transfer Super Admin privileges to
                <strong> {newSuperAdmin.email}</strong> and{" "}
                {actionInviteOption === "remove_access"
                  ? `completely remove your access to the
                TravelMate dashboard`
                  : `your account will be changed to ${
                      adminRoles.find(
                        (role) => role.id === selectedInviteRoleId
                      )?.name
                    } role`}
                . This action cannot be undone. Are you sure you want to
                proceed?
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 justify-end pt-5">
              <Button
                className="border text-[#023E8A] border-[#023E8A] p-2 bg-transparent hover:bg-transparent cursor-pointer"
                onClick={() => setShowConfirmInviteModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  InviteSuperAdmin();
                }}
                className="bg-[#D72638] p-2 px-4 hover:bg-red-700 cursor-pointer"
              >
                {isLoadInvite && (
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

        {/* Success Modal for Inviting Users */}
        <Dialog
          open={showSuccessInviteModal}
          onOpenChange={setShowSuccessInviteModal}
        >
          <DialogContent className="w-full lg:max-w-sm max-w-sm p-8">
            <div className="flex flex-col items-center">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-[500] text-[#181818]">
                  Super Admin Invitation Sent Successfully!
                </DialogTitle>
              </DialogHeader>
              <img
                src="/assets/icons/blue-success.svg"
                alt="Success"
                className="w-20 h-20 my-6"
              />
              <DialogDescription className="lg:text-lg text-[14px] text-gray-700 text-center px-4 font-bold">
                An invitation email has been sent to {newSuperAdmin.email} and
                Your role has been changed to an{" "}
                {adminRoles.find((role) => role.id === selectedInviteRoleId)
                  ?.name || "Admin"}
                .
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ManageSuperAdmin;
