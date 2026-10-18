"use client";

import { deleteFirebaseImage } from "@/utils/utils";
import Image from "next/image";
import { useReducer, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ITeamMember } from "@/models/TeamMember";
import axios from "axios";
import Link from "next/link";

interface TeamMemberState {
  isHovered: boolean;
  isLoaded: boolean;
  toDelete: boolean;
  isDeleting: boolean;
}

type TeamMemberAction =
  | { type: "IMAGE_LOADED" }
  | { type: "HOVER" }
  | { type: "UNHOVER" }
  | { type: "OPEN_DELETE_MODAL" }
  | { type: "CLOSE_DELETE_MODAL" }
  | { type: "DELETING_MEMBER" }
  | { type: "DELETED_MEMBER" };

const initialState: TeamMemberState = {
  isHovered: false,
  isLoaded: false,
  toDelete: false,
  isDeleting: false,
};

const teamMemberReducer = (
  state: TeamMemberState,
  action: TeamMemberAction,
): TeamMemberState => {
  switch (action.type) {
    case "IMAGE_LOADED":
      return { ...state, isLoaded: true };
    case "HOVER":
      return { ...state, isHovered: true };
    case "UNHOVER":
      return { ...state, isHovered: false };
    case "OPEN_DELETE_MODAL":
      return { ...state, toDelete: true };
    case "CLOSE_DELETE_MODAL":
      return { ...state, toDelete: false };
    case "DELETING_MEMBER":
      return { ...state, isDeleting: true };
    case "DELETED_MEMBER":
      return { ...state, isDeleting: false };
    default:
      return state;
  }
};

const TeamMember = ({ teamMember }: { teamMember: ITeamMember }) => {
  const [state, dispatch] = useReducer(teamMemberReducer, initialState);
  const [deleteError, setDeleteError] = useState("");

  const { isHovered, isLoaded, toDelete, isDeleting } = state;

  const { isAuthenticated } = useAuth();

  const handleMouseEnter = () => {
    if (isLoaded) {
      dispatch({ type: "HOVER" });
    }
  };

  const handleMouseLeave = () => {
    if (isLoaded) {
      dispatch({ type: "UNHOVER" });
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    try {
      dispatch({ type: "DELETING_MEMBER" });
      await axios.delete(`/api/team/delete/${teamMember._id}`);
      // Photo cleanup must not turn a successful deletion into a failed retry.
      await deleteFirebaseImage(teamMember.image).catch(console.error);
      dispatch({ type: "DELETED_MEMBER" });
      dispatch({ type: "CLOSE_DELETE_MODAL" });
      window.location.href = "/team"; // hard refresh
    } catch {
      setDeleteError("Unable to remove this member. Please try again.");
      dispatch({ type: "DELETED_MEMBER" });
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-[250px] w-[250px] cursor-pointer transition-all duration-300 ease-in-out overflow-hidden m-[25px] rounded-[25px] shadow-lg"
      >
        {/* Loaded State */}
        <Image
          className="absolute w-full h-full object-cover object-top rounded-[25px] transition-transform duration-300 ease-in-out transform hover:scale-105"
          src={teamMember.image}
          alt={`${teamMember.name}'s picture`}
          fill={true}
          onLoad={() => dispatch({ type: "IMAGE_LOADED" })}
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ennovate-main via-transparent to-transparent transition-opacity duration-300 ease-in-out"
          style={{ opacity: isHovered ? 1 : 0.7 }}
        />
        <div className="absolute bottom-0 left-0 px-6 py-4 text-white z-10">
          <h1 className="font-semibold text-[20px]">{teamMember.name}</h1>
          <p className="font-light text-[14px]">
            {isHovered ? teamMember.email : teamMember.title}
          </p>
        </div>
        {isAuthenticated && (
          <>
            <button
              data-cy="delete-button"
              onClick={() => dispatch({ type: "OPEN_DELETE_MODAL" })}
              className="z-20 absolute rounded-2xl font-bold hover:font-extrabold text-xl top-2 right-2 bg-ennovate-yellow bg-opacity-70 hover:bg-opacity-100 text-white py-2 px-4 rounded"
            >
              -
            </button>
            <Link href={`/admin/team?update=${teamMember._id}`}>
              <button
                data-cy="update-button"
                className="z-20 absolute rounded-2xl font-bold hover:font-extrabold text-xl top-2 right-14 bg-ennovate-yellow bg-opacity-70 hover:bg-opacity-100 text-white py-2 px-4 rounded"
              >
                ?
              </button>
            </Link>
          </>
        )}
        {/* Loading State */}
        <div className={isLoaded ? "hidden" : "block"}>
          <div className="absolute w-full h-full object-cover rounded-[25px] bg-gray-300 z-10"></div>
          <div className="absolute bottom-0 left-0 px-6 py-4 text-white z-50">
            <div className="w-3/4 h-6 bg-gray-400 rounded-md mb-2"></div>
            <div className="w-1/2 h-4 bg-gray-400 rounded-md"></div>
          </div>
        </div>

        {/* Confirm delete modal */}
        {toDelete && (
          <div
            className="fixed inset-0 flex justify-center items-center w-full h-full z-50 bg-black bg-opacity-50"
            data-cy="delete-modal"
          >
            <div className="relative bg-white rounded-xl shadow p-8">
              <button
                type="button"
                className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                data-modal-hide="popup-modal"
                onClick={() => dispatch({ type: "CLOSE_DELETE_MODAL" })}
                data-cy="close-modal-button"
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
              </button>
              <div className="p-4 md:p-5 text-center">
                <svg
                  className="mx-auto mb-4 text-ennovate-dark-blue w-12 h-12"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <h3 className="mb-5 text-xl font-bold text-ennovate-dark-blue">
                  Remove {teamMember.name}?
                </h3>
                {deleteError && (
                  <p role="alert" className="mb-4 text-red-600">
                    {deleteError}
                  </p>
                )}
                <button
                  data-modal-hide="popup-modal"
                  type="button"
                  className="text-white bg-ennovate-main hover:bg-ennovate-dark-blue font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{ opacity: isDeleting ? 0.7 : 1 }}
                >
                  {isDeleting ? "Deleting..." : "Yes, I'm sure"}
                </button>
                <button
                  data-modal-hide="popup-modal"
                  type="button"
                  className="py-2.5 px-5 ms-3 text-sm font-semibold text-ennovate-dark-blue bg-white rounded-lg border border-gray-200 hover:bg-gray-100"
                  onClick={() => dispatch({ type: "CLOSE_DELETE_MODAL" })}
                  disabled={isDeleting}
                  style={{ opacity: isDeleting ? 0.7 : 1 }}
                  data-cy="cancel-delete-button"
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMember;
