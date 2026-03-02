"use client";

import Image from "next/image";
import React, { useEffect, useReducer, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LoaderCircleIcon, SearchIcon, X } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { showErrorToast } from "@/utils/toasters";
import { assignUserToRole, fetchRoles, removeUsersFromRole } from "@/services/admin";
import ClientOnly from "@/app/components/ClientOnly";

// --- TYPES ---
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

type UserWithRole = AssignedUser & { roleName: string };

type ApiErrorResponse = {
  message: string;
};

type State = {
  roles: Role[];
  isLoading: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  searchQuery: string;
  selectedUserIdsToAdd: number[];
  selectedUserIdsToRemove: number[];
  modals: {
    showAddUser: boolean;
    showConfirmAdd: boolean;
    showSuccessAdd: boolean;
    showConfirmRemove: boolean;
    showSuccessRemove: boolean;
  };
};

type Action =
  | { type: "FETCH_ROLES_START" }
  | { type: "FETCH_ROLES_SUCCESS"; payload: Role[] }
  | { type: "FETCH_ROLES_FAILURE" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "TOGGLE_USER_SELECTION_ADD"; payload: number }
  | { type: "TOGGLE_USER_SELECTION_REMOVE"; payload: number }
  | { type: "SET_MODAL_STATE"; payload: { modal: keyof State["modals"]; isOpen: boolean } }
  | { type: "ADD_USERS_START" }
  | { type: "ADD_USERS_SUCCESS" }
  | { type: "ADD_USERS_FAILURE" }
  | { type: "REMOVE_USERS_START" }
  | { type: "REMOVE_USERS_SUCCESS" }
  | { type: "REMOVE_USERS_FAILURE" }
  | { type: "RESET_SUCCESS_MODALS" };

// --- REDUCER ---
const initialState: State = {
  roles: [],
  isLoading: true,
  isAdding: false,
  isRemoving: false,
  searchQuery: "",
  selectedUserIdsToAdd: [],
  selectedUserIdsToRemove: [],
  modals: {
    showAddUser: false,
    showConfirmAdd: false,
    showSuccessAdd: false,
    showConfirmRemove: false,
    showSuccessRemove: false,
  },
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FETCH_ROLES_START":
      return { ...state, isLoading: true };
    case "FETCH_ROLES_SUCCESS":
      return { ...state, roles: action.payload, isLoading: false };
    case "FETCH_ROLES_FAILURE":
      return { ...state, roles: [], isLoading: false };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "TOGGLE_USER_SELECTION_ADD":
      return {
        ...state,
        selectedUserIdsToAdd: state.selectedUserIdsToAdd.includes(action.payload)
          ? state.selectedUserIdsToAdd.filter((id) => id !== action.payload)
          : [...state.selectedUserIdsToAdd, action.payload],
      };
    case "TOGGLE_USER_SELECTION_REMOVE":
        return {
          ...state,
          selectedUserIdsToRemove: state.selectedUserIdsToRemove.includes(action.payload)
            ? state.selectedUserIdsToRemove.filter((id) => id !== action.payload)
            : [...state.selectedUserIdsToRemove, action.payload],
        };
    case "SET_MODAL_STATE":
      return { ...state, modals: { ...state.modals, [action.payload.modal]: action.payload.isOpen } };
    case "ADD_USERS_START":
      return { ...state, isAdding: true };
    case "ADD_USERS_SUCCESS":
      return { ...state, isAdding: false, selectedUserIdsToAdd: [], modals: { ...state.modals, showConfirmAdd: false, showSuccessAdd: true } };
    case "ADD_USERS_FAILURE":
        return { ...state, isAdding: false };
    case "REMOVE_USERS_START":
        return { ...state, isRemoving: true };
    case "REMOVE_USERS_SUCCESS":
        return { ...state, isRemoving: false, selectedUserIdsToRemove: [], modals: { ...state.modals, showConfirmRemove: false, showSuccessRemove: true } };
    case "REMOVE_USERS_FAILURE":
        return { ...state, isRemoving: false };
    case "RESET_SUCCESS_MODALS":
        return { ...state, modals: { ...state.modals, showSuccessAdd: false, showSuccessRemove: false } };
    default:
      return state;
  }
};

// --- HOOKS & UTILS ---
const useRoleData = (dispatch: React.Dispatch<Action>) => {
    const fetchRoleData = useCallback(async () => {
        dispatch({ type: "FETCH_ROLES_START" });
        try {
            const response = await fetchRoles();
            dispatch({ type: "FETCH_ROLES_SUCCESS", payload: response.data.results || [] });
        } catch {
            showErrorToast({ message: "Error fetching roles" });
            dispatch({ type: "FETCH_ROLES_FAILURE" });
        }
    }, [dispatch]);

    useEffect(() => {
        fetchRoleData();
    }, [fetchRoleData]);

    return { refetch: fetchRoleData };
};


// --- MAIN COMPONENT ---
const ManageUsersPage = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { refetch } = useRoleData(dispatch);
  const route = useRouter();
  const params = useParams();
  const roleId = params?.id as string;

  const { roles, isLoading, isAdding, isRemoving, searchQuery, selectedUserIdsToAdd, selectedUserIdsToRemove, modals } = state;

  // --- MEMOIZED DATA ---
  const currentRole = useMemo(() => roles.find((role) => String(role.id) === String(roleId)), [roles, roleId]);
  
  const usersAssignedToOtherRoles = useMemo(() => roles
    .filter((role) => String(role.id) !== String(roleId) && role.name !== "Super Admin")
    .flatMap((role) => role.assigned_users.map((user) => ({ ...user, roleName: role.name }))), [roles, roleId]);

  const filteredUsersToAdd = useMemo(() => usersAssignedToOtherRoles.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ), [usersAssignedToOtherRoles, searchQuery]);

  // --- EFFECTS ---
  useEffect(() => {
    if (modals.showSuccessAdd || modals.showSuccessRemove) {
      const timer = setTimeout(() => dispatch({ type: "RESET_SUCCESS_MODALS" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [modals.showSuccessAdd, modals.showSuccessRemove]);

  // --- HANDLERS ---
  const setModalState = useCallback((modal: keyof State["modals"], isOpen: boolean) => {
    dispatch({ type: "SET_MODAL_STATE", payload: { modal, isOpen } });
  }, []);

  const addUsersToRole = useCallback(async () => {
    const emailsToAdd = usersAssignedToOtherRoles
      .filter((user) => selectedUserIdsToAdd.includes(user.id))
      .map((user) => user.email.trim());

    if (emailsToAdd.length === 0) {
        showErrorToast({ message: "No users selected to add." });
        return;
    }
    
    dispatch({ type: "ADD_USERS_START" });
    try {
      await assignUserToRole(roleId, emailsToAdd.join(","));
      dispatch({ type: "ADD_USERS_SUCCESS" });
      await refetch();
    } catch (error) {
        if (error instanceof AxiosError) {
            const apiError = error.response?.data as ApiErrorResponse;
            showErrorToast({ message: apiError?.message || "Failed to add users." });
        } else {
            showErrorToast({ message: "An unexpected error occurred." });
        }
      dispatch({ type: "ADD_USERS_FAILURE" });
    }
  }, [usersAssignedToOtherRoles, selectedUserIdsToAdd, roleId, refetch]);

  const removeExistingUsers = useCallback(async () => {
    const emailsToRemove = currentRole?.assigned_users
        .filter((user) => selectedUserIdsToRemove.includes(user.id))
        .map((user) => user.email.trim()) || [];

    if (emailsToRemove.length === 0) {
        showErrorToast({ message: "No users selected to remove." });
        return;
    }
        
    dispatch({ type: "REMOVE_USERS_START" });
    try {
      await removeUsersFromRole(roleId, emailsToRemove);
      dispatch({ type: "REMOVE_USERS_SUCCESS" });
      await refetch();
    } catch (error) {
        if (error instanceof AxiosError) {
            const apiError = error.response?.data as ApiErrorResponse;
            showErrorToast({ message: apiError?.message || "Failed to remove users." });
        } else {
            showErrorToast({ message: "An unexpected error occurred." });
        }
      dispatch({ type: "REMOVE_USERS_FAILURE" });
    }
  }, [currentRole, selectedUserIdsToRemove, roleId, refetch]);

  if (isLoading && roles.length === 0) {
    return <div className="flex min-h-screen bg-background rounded-lg items-center justify-center"><LoaderCircleIcon className="animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background rounded-lg">
      <main className="w-full">
        <div className="rounded-lg bg-card md:px-5 px-0 pt-5">
          <div className="flex items-center justify-normal lg:gap-72 gap-32 mb-5">
            <Button variant="ghost" size="icon" onClick={() => route.back()}>
                <Image src="/assets/icons/arrow-back.svg" alt="Back" width={20} height={20} />
            </Button>
            <h1 className="text-lg font-bold text-center ">Manage User</h1>
          </div>
          <Tabs defaultValue="addNewUser" className="space-y-6">
            <TabsList className="w-full border-b rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger value="addNewUser">Add New User</TabsTrigger>
              <TabsTrigger value="removeExistingUser">Remove Existing User</TabsTrigger>
            </TabsList>
            <TabsContent value="addNewUser">
                <AddNewUserTab
                    selectedUserIds={selectedUserIdsToAdd}
                    usersAssignedToOtherRoles={usersAssignedToOtherRoles}
                    onUserSelect={(id) => dispatch({ type: 'TOGGLE_USER_SELECTION_ADD', payload: id })}
                    onShowUserModal={() => setModalState("showAddUser", true)}
                    onConfirm={() => setModalState("showConfirmAdd", true)}
                />
            </TabsContent>
            <TabsContent value="removeExistingUser">
                <RemoveExistingUserTab
                    users={currentRole?.assigned_users || []}
                    selectedUserIds={selectedUserIdsToRemove}
                    onUserSelect={(id) => dispatch({ type: 'TOGGLE_USER_SELECTION_REMOVE', payload: id })}
                    onConfirm={() => setModalState("showConfirmRemove", true)}
                    disabled={selectedUserIdsToRemove.length === 0}
                />
            </TabsContent>
          </Tabs>
        </div>

        <ClientOnly>
          <UserSelectionModal
            isOpen={modals.showAddUser}
            onClose={() => setModalState("showAddUser", false)}
            users={filteredUsersToAdd}
            selectedUserIds={selectedUserIdsToAdd}
            searchQuery={searchQuery}
            onSearchChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            onUserSelect={(id) => dispatch({ type: 'TOGGLE_USER_SELECTION_ADD', payload: id })}
            isLoading={isLoading}
          />
          <ConfirmModal
            isOpen={modals.showConfirmAdd}
            onClose={() => setModalState("showConfirmAdd", false)}
            onConfirm={addUsersToRole}
            title="Confirm Member Transfer?"
            description={`You are about to add ${selectedUserIdsToAdd.length} selected user(s) to this role. These users will be removed from their current roles. Do you want to proceed?`}
            isLoading={isAdding}
          />
          <SuccessModal
            isOpen={modals.showSuccessAdd}
            onClose={() => setModalState("showSuccessAdd", false)}
            title="Success"
            description="User Added Successfully"
          />
          <ConfirmModal
            isOpen={modals.showConfirmRemove}
            onClose={() => setModalState("showConfirmRemove", false)}
            onConfirm={removeExistingUsers}
            title="Confirm Remove Users?"
            description={`You are about to remove the selected users from ${currentRole?.name} role. They will no longer have access to these role permissions. Do you want to proceed?`}
            isLoading={isRemoving}
            confirmButtonVariant="destructive"
          />
          <SuccessModal
            isOpen={modals.showSuccessRemove}
            onClose={() => setModalState("showSuccessRemove", false)}
            title="Success"
            description="Users Removed Successfully"
          />
        </ClientOnly>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const AddNewUserTab = ({ selectedUserIds, usersAssignedToOtherRoles, onUserSelect, onShowUserModal, onConfirm }: { selectedUserIds: number[], usersAssignedToOtherRoles: UserWithRole[], onUserSelect: (id: number) => void, onShowUserModal: () => void, onConfirm: () => void }) => (
    <div className="space-y-4 px-3">
        <p>Assign user from another role</p>
        <Button variant="outline" className="w-full justify-between" onClick={onShowUserModal}>
            <span>{selectedUserIds.length > 0 ? `${selectedUserIds.length} user(s) selected` : "Select User"}</span>
            <Image src="/assets/icons/arrow-down.svg" alt="arrow-down" width={12} height={12} />
        </Button>
        <div className="flex flex-wrap gap-2 items-start">
          {selectedUserIds.length > 0 && usersAssignedToOtherRoles
              .filter((user) => selectedUserIds.includes(user.id))
              .map((user) => (
                  <div key={user.id} className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
                      <p>{user.name}</p>
                      <X className="w-4 h-4 cursor-pointer" onClick={() => onUserSelect(user.id)} />
                  </div>
              ))
          }
        </div>
        <Button onClick={onConfirm} className="mt-24 w-full" disabled={selectedUserIds.length === 0}>
            Add
        </Button>
    </div>
);

const RemoveExistingUserTab = ({ users, selectedUserIds, onUserSelect, onConfirm, disabled }: { users: AssignedUser[], selectedUserIds: number[], onUserSelect: (id: number) => void, onConfirm: () => void, disabled: boolean }) => (
    <div className="space-y-8 px-3">
        <p className="font-bold">Select Users to remove</p>
        {users.length > 0 ? users.map((user) => (
            <div key={user.id} className="flex justify-between items-center py-2 border-b">
                <div>
                    <p className="font-semibold">{user.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    title={`Select ${user.name} to remove`}
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => onUserSelect(user.id)}
                    aria-label={`Remove ${user.name}`}
                />
            </div>
        )) : <p className="text-center text-gray-500">No users in this role.</p>}
        <Button onClick={onConfirm} variant="destructive" className="mt-24 w-full" disabled={disabled}>
            Remove
        </Button>
    </div>
);

const UserSelectionModal = ({ isOpen, onClose, users, selectedUserIds, searchQuery, onSearchChange, onUserSelect, isLoading }: { isOpen: boolean, onClose: () => void, users: UserWithRole[], selectedUserIds: number[], searchQuery: string, onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onUserSelect: (id: number) => void, isLoading: boolean }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl overflow-y-auto w-[90vw] max-h-[85vh]">
            <DialogHeader><DialogTitle>Select Users to Add</DialogTitle></DialogHeader>
            <div className="relative my-4">
                <SearchIcon className="w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="search" className="w-full border border-gray-300 rounded-lg p-2 pl-10" placeholder="Search Users by name or email" value={searchQuery} onChange={onSearchChange} aria-label="Search Users by name or email" />
            </div>
            {isLoading ? <div className="flex justify-center p-8"><LoaderCircleIcon className="animate-spin" /></div> :
                <div className="space-y-2">
                    {users.length === 0 ? <p className="text-center text-gray-500">No users available to add.</p> :
                        users.map((user) => (
                            <div key={user.id} className="flex justify-between w-full items-center py-2 border-b">
                                <div className="flex items-center gap-4">
                                    <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" title={`Select ${user.name} to add`} checked={selectedUserIds.includes(user.id)} onChange={() => onUserSelect(user.id)} aria-label={`Add ${user.name}`} />
                                    <div>
                                        <p>{user.name || "Unknown user"}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <p className="text-blue-500 text-nowrap text-sm">{user.roleName}</p>
                            </div>
                        ))}
                </div>
            }
        </DialogContent>
    </Dialog>
);

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, isLoading, confirmButtonVariant = "default" }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, description: string, isLoading: boolean, confirmButtonVariant?: "default" | "destructive" }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
            <DialogDescription className="pt-2">{description}</DialogDescription>
            <div className="flex items-center gap-2 justify-end pt-5">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button onClick={onConfirm} variant={confirmButtonVariant} disabled={isLoading}>
                    {isLoading && <LoaderCircleIcon className="animate-spin mr-2 h-4 w-4" />}
                    Yes, Proceed
                </Button>
            </div>
        </DialogContent>
    </Dialog>
);

const SuccessModal = ({ isOpen, onClose, title, description }: { isOpen: boolean, onClose: () => void, title: string, description: string }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <div className="flex flex-col items-center text-center p-4">
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <Image src="/assets/icons/blue-success.svg" alt="Success" width={80} height={80} className="my-6" />
                <DialogDescription>{description}</DialogDescription>
            </div>
        </DialogContent>
    </Dialog>
);


export default ManageUsersPage;
