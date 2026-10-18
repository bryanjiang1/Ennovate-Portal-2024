"use client";

import Search from "@/components/search/search";
import { ITeamMember } from "@/models/TeamMember";
import { useEffect, useReducer } from "react";
import PageCenteringWrapper from "@/wrappers/pageCenteringWrapper";
import axios from "axios";
import TeamMemberSkeletonGrid from "@/components/teamMemberSkeletonGrid/teamMemberSkeletonGrid";
import NoTeam from "@/components/noTeam/noTeam";
import TeamMemberGrid from "@/components/teamMemberGrid/teamMemberGrid";
import Pagination from "@/components/pagination/pagination";

interface TeamMembersState {
  teamMembers: ITeamMember[];
  totalPages: number;
  loading: boolean;
  error: boolean;
}

type TeamMembersAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: { teamMembers: ITeamMember[]; totalPages: number };
    }
  | { type: "FETCH_FAILURE" };

const initialState: TeamMembersState = {
  teamMembers: [],
  totalPages: 0,
  loading: true,
  error: false,
};

const teamMembersReducer = (
  state: TeamMembersState,
  action: TeamMembersAction,
): TeamMembersState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: false };
    case "FETCH_SUCCESS":
      return {
        ...state,
        teamMembers: action.payload.teamMembers,
        totalPages: action.payload.totalPages,
        loading: false,
      };
    case "FETCH_FAILURE":
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
};

export default function Team({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page: string;
  };
}) {
  const query: string = searchParams?.query || "";
  const currentPage: number = Number(searchParams?.page) || 1;
  const [state, dispatch] = useReducer(teamMembersReducer, initialState);
  const { teamMembers, totalPages, loading, error } = state;

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const res = await axios.post(
          "/api/team/paginate",
          {
            query,
            currentPage,
          },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const { teamMembers, totalPages } = res.data;
        dispatch({
          type: "FETCH_SUCCESS",
          payload: { teamMembers, totalPages },
        });
      } catch {
        if (!controller.signal.aborted) dispatch({ type: "FETCH_FAILURE" });
      }
    };

    fetchData();
    return () => controller.abort();
  }, [query, currentPage]);

  return (
    <PageCenteringWrapper>
      <h1 className="text-center font-extrabold text-5xl mt-8 text-ennovate-dark-blue mx-8">
        Get to know the team!
      </h1>
      <Search />
      {loading ? (
        <TeamMemberSkeletonGrid />
      ) : error ? (
        <p role="alert" className="my-8 text-red-600">
          Unable to load the team. Please reload and try again.
        </p>
      ) : totalPages == 0 ? (
        <NoTeam />
      ) : (
        <TeamMemberGrid
          teamMembers={teamMembers}
          isLastPage={currentPage == totalPages}
        />
      )}
      <Pagination totalPages={totalPages} />
    </PageCenteringWrapper>
  );

  /*
      <TeamMember
        name="Arisha Ahmed"
        email="test email"
        img="/arisha-ahmed.jpg"
        title="test"
      />
  */
}
