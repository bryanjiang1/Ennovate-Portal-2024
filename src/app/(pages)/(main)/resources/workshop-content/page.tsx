"use client";

import Loading from "@/components/loading/loading";
import { useEffect, useReducer, useState } from "react";
import axios from "axios";
import PageCenteringWrapper from "@/wrappers/pageCenteringWrapper";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { IBusinessWorkshop } from "@/models/BusinessWorkshop";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

type BusinessWorkshopState = {
  businessWorkshops: IBusinessWorkshop[] | null;
  toDelete: boolean;
  selectedWorkshop: IBusinessWorkshop | null;
  isDeleting: boolean;
};

type BusinessWorkshopAction =
  | { type: "SET_WORKSHOPS"; payload: IBusinessWorkshop[] }
  | { type: "OPEN_DELETE_MODAL"; payload: IBusinessWorkshop }
  | { type: "CLOSE_DELETE_MODAL" }
  | { type: "SET_IS_DELETING"; payload: boolean }
  | { type: "DELETE_SUCCESS"; payload: string };

const initialState: BusinessWorkshopState = {
  businessWorkshops: null,
  toDelete: false,
  selectedWorkshop: null,
  isDeleting: false,
};

// Reducer function
function businessWorkshopReducer(
  state: BusinessWorkshopState,
  action: BusinessWorkshopAction
): BusinessWorkshopState {
  switch (action.type) {
    case "SET_WORKSHOPS":
      return { ...state, businessWorkshops: action.payload };
    case "OPEN_DELETE_MODAL":
      return { ...state, toDelete: true, selectedWorkshop: action.payload };
    case "CLOSE_DELETE_MODAL":
      return { ...state, toDelete: false, selectedWorkshop: null };
    case "SET_IS_DELETING":
      return { ...state, isDeleting: action.payload };
    case "DELETE_SUCCESS":
      return {
        ...state,
        toDelete: false,
        isDeleting: false,
        businessWorkshops: state.businessWorkshops?.filter(
          (workshop) => workshop._id !== action.payload
        ) || null,
      };
    default:
      return state;
  }
}

export default function BusinessWorkshops() {
  const [state, dispatch] = useReducer(businessWorkshopReducer, initialState);
  const { businessWorkshops, toDelete, selectedWorkshop, isDeleting } = state;
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [initialWorkshops, setInitialWorkshops] = useState<IBusinessWorkshop[] | null>(null);


  const handleSearch = useDebouncedCallback((s: string) => {
    dispatch({ type: "SET_WORKSHOPS", payload: initialWorkshops!.filter((b) => b.name.toLowerCase().includes(s.toLowerCase())) })
  }, 150);


  useEffect(() => {
    const initializeData = async () => {
      const workshopsRes = await axios.post("/api/business-workshops/read");
      dispatch({ type: "SET_WORKSHOPS", payload: workshopsRes.data });
      setInitialWorkshops(workshopsRes.data);
    };

    initializeData();
  }, []);

  const handleDelete = async () => {
    if (!selectedWorkshop) return;

    dispatch({ type: "SET_IS_DELETING", payload: true });
    try {
      await axios.delete(`/api/business-workshops/delete/${selectedWorkshop._id}`);
      dispatch({ type: "DELETE_SUCCESS", payload: selectedWorkshop._id });
      router.push("/resources/business-workshops");
    } catch (error) {
      console.error("Failed to delete business workshop", error);
    } finally {
      dispatch({ type: "SET_IS_DELETING", payload: false });
    }
  };

  if (!businessWorkshops) {
    return (
      <PageCenteringWrapper>
        <Loading />
      </PageCenteringWrapper>
    );
  }


  const TableRow = ({ businessWorkshop }: { businessWorkshop: IBusinessWorkshop }) => {
    return (
      <tr className="bg-white border-b">
        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
          {businessWorkshop.name}
        </th>
        <td className="px-6 py-4">{businessWorkshop.month}</td>
        <td className="px-6 py-4">
          {businessWorkshop.slides ?
            <Link href={businessWorkshop.slides} target="_blank" className="font-medium text-ennovate-main hover:underline">
              View
            </Link> : "-"}
        </td>
        <td className="px-6 py-4">
          {businessWorkshop.worksheet ?
            <Link href={businessWorkshop.worksheet} target="_blank" className="font-medium text-ennovate-main hover:underline">
              View
            </Link> : "-"}
        </td>
        {isAuthenticated && (
          <>
            <td className="px-6 py-4">
              <Link href={`/admin/workshop-content?update=${businessWorkshop._id}`} className="font-medium text-ennovate-main hover:underline mr-4">
                Edit
              </Link>
            </td>
            <td className="px-6 py-4">
              <button
                className="font-medium text-red-600 hover:underline mr-4"
                onClick={() => dispatch({ type: "OPEN_DELETE_MODAL", payload: businessWorkshop })}
              >
                Delete
              </button>
            </td>
          </>
        )}
      </tr>
    );
  };


  return (
    <div className="mx-8 mt-8">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between pb-4 mb-2">
        {/* Search Bar */}
        <label htmlFor="table-search" className="sr-only">
          Search
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-500"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            id="table-search"
            className="block p-2 ps-10 text-md text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-ennovate-main focus:border-ennovate-main"
            placeholder="Search Workshop Name"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-md text-left text-gray-500">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Month
              </th>
              <th scope="col" className="px-6 py-3">
                Slides
              </th>
              <th scope="col" className="px-6 py-3">
                Worksheet
              </th>
              {isAuthenticated && (
                <th scope="col" className="px-6 py-3" colSpan={2}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {businessWorkshops.map((workshop, index) => (
              <TableRow key={index} businessWorkshop={workshop} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm delete modal */}
      {toDelete && selectedWorkshop && (
        <div className="fixed inset-0 flex justify-center items-center w-full h-full z-50 bg-black bg-opacity-50">
          <div className="relative bg-white rounded-xl shadow p-8">
            <button
              type="button"
              className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              onClick={() => dispatch({ type: "CLOSE_DELETE_MODAL" })}
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
                Remove {selectedWorkshop.name}?
              </h3>
              <button
                type="button"
                className="text-white bg-ennovate-main hover:bg-ennovate-dark-blue font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ opacity: isDeleting ? 0.7 : 1 }}
              >
                {isDeleting ? "Deleting..." : "Yes, I'm sure"}
              </button>
              <button
                type="button"
                className="py-2.5 px-5 ms-3 text-sm font-semibold text-ennovate-dark-blue bg-white rounded-lg border border-gray-200 hover:bg-gray-100"
                onClick={() => dispatch({ type: "CLOSE_DELETE_MODAL" })}
                disabled={isDeleting}
                style={{ opacity: isDeleting ? 0.7 : 1 }}
              >
                No, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
