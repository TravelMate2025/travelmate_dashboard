"use client";

import Image from "next/image";
import React, { useEffect, useReducer, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showErrorToast } from "@/utils/toasters";
import { LoaderCircleIcon } from "lucide-react";
import { fetchRoles, inviteSupes, transferSupes } from "@/services/admin";
import { Input } from "@/components/ui/input";

// Constants
const ROLE_SUPER_ADMIN = "Super Admin";
const TRANSFER_ACTION_CHANGE_ROLE = "change_role";
const TRANSFER_ACTION_REMOVE_ACCESS = "remove_access";
const REDIRECT_DELAY = 3000;

// Types
type AssignedUser = {
  id: number;
  email: string;
  name: string;
};

type Role = {
  id: string;
  name: string;
  assigned_users: AssignedUser[];
};

type SuperAdmin = {
  name: string;
  email: string;
};

type State = {
  roles: Role[];
  selectedUserId: number | null;
  selectedRoleId: string | null;
  selectedInviteRoleId: string | null;
  showConfirmModal: boolean;
  showConfirmInviteModal: boolean;
  showSuccessModal: boolean;
  showSuccessInviteModal: boolean;
  actionTransferOption: string;
  changeRoleTransfer: boolean;
  actionInviteOption: string;
  changeRoleInvite: boolean;
  newSuperAdmin: SuperAdmin;
  isLoading: boolean;
  isLoadInvite: boolean;
  isLoadTransfer: boolean;
};

type Action =
  | { type: "SET_ROLES"; payload: Role[] }
  | { type: "SET_SELECTED_USER_ID"; payload: number | null }
  | { type: "SET_SELECTED_ROLE_ID"; payload: string | null }
  | { type: "SET_SELECTED_INVITE_ROLE_ID"; payload: string | null }
  | { type: "SET_SHOW_CONFIRM_MODAL"; payload: boolean }
  | { type: "SET_SHOW_CONFIRM_INVITE_MODAL"; payload: boolean }
  | { type: "SET_SHOW_SUCCESS_MODAL"; payload: boolean }
  | { type: "SET_SHOW_SUCCESS_INVITE_MODAL"; payload: boolean }
  | { type: "SET_ACTION_TRANSFER_OPTION"; payload: string }
  | { type: "SET_CHANGE_ROLE_TRANSFER"; payload: boolean }
  | { type: "SET_ACTION_INVITE_OPTION"; payload: string }
  | { type: "SET_CHANGE_ROLE_INVITE"; payload: boolean }
  | { type: "SET_NEW_SUPER_ADMIN"; payload: SuperAdmin }
  | { type: "SET_IS_LOADING"; payload: boolean }
    | { type: "SET_IS_LOAD_INVITE"; payload: boolean }
    | { type: "SET_IS_LOAD_TRANSFER"; payload: boolean }
  | { type: "RESET_TRANSFER_STATE" }
  | { type: "RESET_INVITE_STATE" };

const initialState: State = {
  roles: [],
  selectedUserId: null,
  selectedRoleId: null,
  selectedInviteRoleId: null,
  showConfirmModal: false,
  showConfirmInviteModal: false,
  showSuccessModal: false,
  showSuccessInviteModal: false,
  actionTransferOption: "",
  changeRoleTransfer: false,
  actionInviteOption: "",
  changeRoleInvite: false,
  newSuperAdmin: { name: "", email: "" },
  isLoading: true,
    isLoadInvite: false,
    isLoadTransfer: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_ROLES":
      return { ...state, roles: action.payload, isLoading: false };
    case "SET_SELECTED_USER_ID":
      return { ...state, selectedUserId: action.payload };
    case "SET_SELECTED_ROLE_ID":
      return { ...state, selectedRoleId: action.payload };
    case "SET_SELECTED_INVITE_ROLE_ID":
        return { ...state, selectedInviteRoleId: action.payload };
    case "SET_SHOW_CONFIRM_MODAL":
        return { ...state, showConfirmModal: action.payload };
    case "SET_SHOW_CONFIRM_INVITE_MODAL":
        return { ...state, showConfirmInviteModal: action.payload };
    case "SET_SHOW_SUCCESS_MODAL":
        return { ...state, showSuccessModal: action.payload };
    case "SET_SHOW_SUCCESS_INVITE_MODAL":
        return { ...state, showSuccessInviteModal: action.payload };
    case "SET_ACTION_TRANSFER_OPTION":
        return { ...state, actionTransferOption: action.payload };
    case "SET_CHANGE_ROLE_TRANSFER":
        return { ...state, changeRoleTransfer: action.payload };
    case "SET_ACTION_INVITE_OPTION":
        return { ...state, actionInviteOption: action.payload };
    case "SET_CHANGE_ROLE_INVITE":
        return { ...state, changeRoleInvite: action.payload };
    case "SET_NEW_SUPER_ADMIN":
        return { ...state, newSuperAdmin: action.payload };
    case "SET_IS_LOADING":
        return { ...state, isLoading: action.payload };
    case "SET_IS_LOAD_INVITE":
        return { ...state, isLoadInvite: action.payload };
    case "SET_IS_LOAD_TRANSFER":
        return { ...state, isLoadTransfer: action.payload };
    case "RESET_TRANSFER_STATE":
        return {
            ...state,
            selectedUserId: null,
            selectedRoleId: null,
            actionTransferOption: "",
            changeRoleTransfer: false,
        };
    case "RESET_INVITE_STATE":
        return {
            ...state,
            newSuperAdmin: { name: "", email: "" },
            selectedInviteRoleId: null,
            actionInviteOption: "",
            changeRoleInvite: false,
        };
    default:
      return state;
  }
};

// Custom Hook for fetching roles
const useRoles = (dispatch: React.Dispatch<Action>) => {
  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        dispatch({ type: "SET_IS_LOADING", payload: true });
        const response = await fetchRoles();
        dispatch({ type: "SET_ROLES", payload: response.data.results || [] });
      } catch {
        showErrorToast({ message: "Failed to fetch roles." });
        dispatch({ type: "SET_ROLES", payload: [] });
      }
    };
    fetchRoleData();
  }, [dispatch]);
};


const ManageSuperAdmin = () => {
  const route = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  useRoles(dispatch);

    const { roles, isLoading } = state;

  const adminRoles = useMemo(() => roles.filter((role) => role.name !== ROLE_SUPER_ADMIN), [roles]);

  const handleTransferRole = async () => {
    const { selectedUserId, actionTransferOption, selectedRoleId } = state;
    const userToTransfer = adminRoles
        .flatMap((role) => role.assigned_users)
        .find((user) => user.id === selectedUserId);

    if (!userToTransfer) {
        showErrorToast({ message: "Selected user not found." });
        return;
    }

    try {
        dispatch({ type: "SET_IS_LOAD_TRANSFER", payload: true });
        const payload = {
            email: userToTransfer.email,
            transfer_action: actionTransferOption,
            new_role_id: selectedRoleId ?? "",
        };
        await transferSupes(payload);
        dispatch({ type: "SET_SHOW_CONFIRM_MODAL", payload: false });
        dispatch({ type: "SET_SHOW_SUCCESS_MODAL", payload: true });
        setTimeout(() => route.push("/auth/login"), REDIRECT_DELAY);
    } catch (error) {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cannot transfer role.";
        showErrorToast({
            message: errorMessage,
        });
    } finally {
        dispatch({ type: "SET_IS_LOAD_TRANSFER", payload: false });
    }
  };

  const handleInviteSuperAdmin = async () => {
    const { newSuperAdmin, actionInviteOption, selectedInviteRoleId } = state;
    try {
        dispatch({ type: "SET_IS_LOAD_INVITE", payload: true });
        const payload = {
            email: newSuperAdmin.email,
            name: newSuperAdmin.name,
            transfer_action: actionInviteOption,
            new_role_id: selectedInviteRoleId ?? "",
        };
        await inviteSupes(payload);
        dispatch({ type: "SET_SHOW_CONFIRM_INVITE_MODAL", payload: false });
        dispatch({ type: "SET_SHOW_SUCCESS_INVITE_MODAL", payload: true });
        setTimeout(() => route.push("/auth/login"), REDIRECT_DELAY);
    } catch (error) {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cannot invite member.";
        showErrorToast({
            message: errorMessage,
        });
    } finally {
        dispatch({ type: "SET_IS_LOAD_INVITE", payload: false });
    }
  };

  if (isLoading) {
    return (
        <div className="flex min-h-screen bg-background rounded-lg items-center justify-center">
            <LoaderCircleIcon className="animate-spin" />
        </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background rounded-lg">
      <main className="w-full px-3">
        <div className="rounded-lg bg-card md:px-5 px-0 pt-5">
            <div className="flex items-center justify-normal lg:gap-72 gap-3 mb-5">
                <Button variant="ghost" size="icon" onClick={() => route.back()}>
                    <Image
                    src="/assets/icons/arrow-back.svg"
                    alt="Back"
                    width={20}
                    height={20}
                    />
                </Button>
                <h1 className="font-bold text-center">Manage Super Admin role</h1>
            </div>
          <Tabs defaultValue="addNewUser" className="space-y-6">
            <TabsList className="w-full border-b rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger value="addNewUser">Transfer to existing user</TabsTrigger>
              <TabsTrigger value="removeExistingUser">Invite new user</TabsTrigger>
            </TabsList>

            <TabsContent value="addNewUser">
                <TransferSuperAdmin state={state} dispatch={dispatch} adminRoles={adminRoles} onTransfer={handleTransferRole} />
            </TabsContent>

            <TabsContent value="removeExistingUser">
                <InviteSuperAdmin state={state} dispatch={dispatch} adminRoles={adminRoles} onInvite={handleInviteSuperAdmin} />
            </TabsContent>
          </Tabs>
        </div>
        <SuccessModal
            isOpen={state.showSuccessModal}
            onClose={() => dispatch({ type: "SET_SHOW_SUCCESS_MODAL", payload: false })}
            title="Success"
            description="User Added Successfully"
        />
        <SuccessModal
            isOpen={state.showSuccessInviteModal}
            onClose={() => dispatch({ type: "SET_SHOW_SUCCESS_INVITE_MODAL", payload: false })}
            title="Super Admin Invitation Sent Successfully!"
            description={`An invitation email has been sent to ${state.newSuperAdmin.email}.`}
        />
      </main>
    </div>
  );
};

const TransferSuperAdmin = ({ state, dispatch, adminRoles, onTransfer }: { state: State, dispatch: React.Dispatch<Action>, adminRoles: Role[], onTransfer: () => void }) => {
    const { selectedUserId, actionTransferOption, changeRoleTransfer, selectedRoleId, isLoadTransfer } = state;

    const selectedUser = adminRoles
        .flatMap((role) => role.assigned_users)
        .find((user) => user.id === selectedUserId);

    return (
        <div>
            <p>Select user to transfer super admin privileges to</p>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between mt-3">
                        <span>{selectedUser?.name || "Select User"}</span>
                        <Image src="/assets/icons/arrow-down.svg" alt="arrow-down" width={12} height={12} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)]">
                    {adminRoles.length === 0 ? (
                        <DropdownMenuItem disabled>No users available</DropdownMenuItem>
                    ) : (
                        adminRoles.map((role) =>
                            role.assigned_users.map((user) => (
                                <DropdownMenuItem key={user.id} onSelect={() => dispatch({ type: "SET_SELECTED_USER_ID", payload: user.id })}>
                                    <div className="flex justify-between w-full">
                                        <p>{user.name}</p>
                                        <p className="text-muted-foreground">{role.name}</p>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="pt-5">
                <p>After transfer, select what happens to your account</p>
                <div className="flex w-full justify-normal lg:flex-row flex-col lg:items-center gap-4 mt-3">
                    <div className="flex items-center gap-4">
                        <input type="radio" name="option" value={TRANSFER_ACTION_CHANGE_ROLE} id="change-role" onChange={(e) => {
                            dispatch({ type: 'SET_CHANGE_ROLE_TRANSFER', payload: true });
                            dispatch({ type: 'SET_ACTION_TRANSFER_OPTION', payload: e.target.value });
                        }} />
                        <label htmlFor="change-role">Change my role</label>
                    </div>
                    <div className="flex items-center gap-4">
                        <input type="radio" name="option" value={TRANSFER_ACTION_REMOVE_ACCESS} id="remove-access" onChange={(e) => {
                            dispatch({ type: 'SET_CHANGE_ROLE_TRANSFER', payload: false });
                            dispatch({ type: 'SET_ACTION_TRANSFER_OPTION', payload: e.target.value });
                        }} />
                        <label htmlFor="remove-access">Remove my access completely</label>
                    </div>
                </div>
                {changeRoleTransfer && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between mt-3">
                                <span>{adminRoles.find(role => role.id === selectedRoleId)?.name || "Select Role"}</span>
                                <Image src="/assets/icons/arrow-down.svg" alt="arrow-down" width={12} height={12} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)]">
                            {adminRoles.map((role) => (
                                <DropdownMenuItem key={role.id} onSelect={() => dispatch({ type: "SET_SELECTED_ROLE_ID", payload: role.id })}>
                                    {role.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                     </DropdownMenu>
                )}
            </div>

            <Button
                disabled={isLoadTransfer || !selectedUserId || !actionTransferOption || (changeRoleTransfer && !selectedRoleId)}
                onClick={() => dispatch({ type: "SET_SHOW_CONFIRM_MODAL", payload: true })}
                className="mt-24 w-full"
            >
                Save Changes
            </Button>
            <ConfirmModal
                isOpen={state.showConfirmModal}
                onClose={() => dispatch({ type: "SET_SHOW_CONFIRM_MODAL", payload: false })}
                onConfirm={onTransfer}
                title="Confirm Member Transfer?"
                description="You are about to add this selected user to this role. These users will be removed from their current roles. Do you want to proceed?"
                isLoading={isLoadTransfer}
            />
        </div>
    );
}

const InviteSuperAdmin = ({ state, dispatch, adminRoles, onInvite }: { state: State, dispatch: React.Dispatch<Action>, adminRoles: Role[], onInvite: () => void }) => {
    const { newSuperAdmin, actionInviteOption, changeRoleInvite, selectedInviteRoleId, isLoadInvite } = state;

    return (
        <div>
            <p className="font-bold">Add New Super Admin Information</p>
            <div className="space-y-4 py-3">
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="font-semibold">Name</label>
                    <Input
                        id="name"
                        type="text"
                        value={newSuperAdmin.name}
                        onChange={(e) => dispatch({ type: "SET_NEW_SUPER_ADMIN", payload: { ...newSuperAdmin, name: e.target.value } })}
                        name="name"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="font-semibold">Email Address</label>
                    <Input
                        id="email"
                        type="email"
                        value={newSuperAdmin.email}
                        name="email"
                        onChange={(e) => dispatch({ type: "SET_NEW_SUPER_ADMIN", payload: { ...newSuperAdmin, email: e.target.value } })}
                    />
                </div>
            </div>
             <div className="pt-5">
                <p>After transfer, select what happens to your account</p>
                <div className="flex w-full justify-normal lg:flex-row flex-col lg:items-center gap-4 mt-3">
                    <div className="flex items-center gap-4">
                        <input type="radio" name="transfer-invite" value={TRANSFER_ACTION_CHANGE_ROLE} id="change-role-invite" onChange={(e) => {
                            dispatch({ type: 'SET_CHANGE_ROLE_INVITE', payload: true });
                            dispatch({ type: 'SET_ACTION_INVITE_OPTION', payload: e.target.value });
                        }} />
                        <label htmlFor="change-role-invite">Change my role</label>
                    </div>
                    <div className="flex items-center gap-4">
                        <input type="radio" name="transfer-invite" value={TRANSFER_ACTION_REMOVE_ACCESS} id="remove-access-invite" onChange={(e) => {
                            dispatch({ type: 'SET_CHANGE_ROLE_INVITE', payload: false });
                            dispatch({ type: 'SET_ACTION_INVITE_OPTION', payload: e.target.value });
                        }} />
                        <label htmlFor="remove-access-invite">Remove my access completely</label>
                    </div>
                </div>
                 {changeRoleInvite && (
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                             <Button variant="outline" className="w-full justify-between mt-3">
                                 <span>{adminRoles.find(role => role.id === selectedInviteRoleId)?.name || "Select Role"}</span>
                                 <Image src="/assets/icons/arrow-down.svg" alt="arrow-down" width={12} height={12} />
                             </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)]">
                             {adminRoles.map((role) => (
                                 <DropdownMenuItem key={role.id} onSelect={() => dispatch({ type: "SET_SELECTED_INVITE_ROLE_ID", payload: role.id })}>
                                     {role.name}
                                 </DropdownMenuItem>
                             ))}
                         </DropdownMenuContent>
                      </DropdownMenu>
                 )}
            </div>
            <Button
                disabled={isLoadInvite || !newSuperAdmin.name || !newSuperAdmin.email || !actionInviteOption || (changeRoleInvite && !selectedInviteRoleId)}
                onClick={() => dispatch({ type: "SET_SHOW_CONFIRM_INVITE_MODAL", payload: true })}
                className="mt-24 w-full"
            >
                Send invitation
            </Button>
            <ConfirmModal
                isOpen={state.showConfirmInviteModal}
                onClose={() => dispatch({ type: "SET_SHOW_CONFIRM_INVITE_MODAL", payload: false })}
                onConfirm={onInvite}
                title="Confirm Super Admin Invite?"
                description={`You are about to invite and transfer Super Admin privileges to ${newSuperAdmin.email}.`}
                isLoading={isLoadInvite}
                confirmButtonVariant="destructive"
            />
        </div>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, isLoading, confirmButtonVariant = "default" }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, description: string, isLoading: boolean, confirmButtonVariant?: "default" | "destructive" }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <DialogDescription>{description}</DialogDescription>
            <div className="flex items-center gap-2 justify-end pt-5">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant={confirmButtonVariant} disabled={isLoading}>
                    {isLoading && <LoaderCircleIcon className="animate-spin mr-2" />}
                    Yes, Proceed
                </Button>
            </div>
        </DialogContent>
    </Dialog>
);

const SuccessModal = ({ isOpen, onClose, title, description }: { isOpen: boolean, onClose: () => void, title: string, description: string }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <div className="flex flex-col items-center">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <Image src="/assets/icons/blue-success.svg" alt="Success" width={80} height={80} className="my-6" />
                <DialogDescription>{description}</DialogDescription>
            </div>
        </DialogContent>
    </Dialog>
);

export default ManageSuperAdmin;
