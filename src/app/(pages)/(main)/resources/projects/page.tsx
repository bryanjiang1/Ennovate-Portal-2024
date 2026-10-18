'use client'

import Loading from "@/components/loading/loading";
import { useAuth } from "@/hooks/useAuth";
import { IProjectPopulated } from "@/models/Project";
import PageCenteringWrapper from "@/wrappers/pageCenteringWrapper";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ModalState = 'close' | 'delete' | 'slide';

export default function Projects() {
  const [projects, setProjects] = useState<
    IProjectPopulated[] | null
  >(null);

  const router = useRouter();

  const [modalState, setModalState] = useState<ModalState>('close');
  const [selectedProject, setSelectedProject] = useState<IProjectPopulated | null>(null);
  const [action, setAction] = useState<boolean>(false);
  const [slideLink, setSlideLink] = useState<string>('');

  const { isAuthenticated } = useAuth();

  const handleAction = async () => {
    try {
      setAction(true);
      if (modalState == 'delete') {
        await axios.delete(`/api/projects/delete/${selectedProject?._id}`);
      } else if (modalState == 'slide') {
        await axios.put(`/api/projects/update/${selectedProject?._id}`, {
          name: selectedProject?.name,
          description: selectedProject?.description,
          blog: selectedProject?.blog,
          businessProposal: selectedProject?.businessProposal,
          presentationSlides: slideLink // change one field
        })
      }
      setModalState('close');
      setAction(false);
      window.location.href = "/resources/projects";
    } catch (e) {
      setAction(false);
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      const res = await axios.post("/api/projects/query");
      setProjects(res.data);
      console.log(res.data)
    };

    initializeData();
  }, []);

  if (!projects) {
    return (
      <PageCenteringWrapper>
        <Loading />
      </PageCenteringWrapper>
    );
  }
  return (

    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 mx-8 mt-8">
      {projects.map((project) => (
        <div key={project._id} className="flex flex-col bg-white shadow-sm border border-slate-200 rounded-lg my-6 w-96 ">
          <div className="m-2.5 overflow-hidden rounded-md h-80 flex justify-center items-center h-[300px]">
            <img className="w-full h-full object-fill" src={project.businessProposal ? project.businessProposal.image : "/logos/enactus-logo.webp"} alt="profile-picture" />
          </div>

          {/* FLEX GROW IMPORTANT */}
          <div className="p-6 text-center flex-grow">
            <h4 className="mb-1 text-xl font-semibold text-slate-800">
              {project.name}
            </h4>
            <p className="text-base text-slate-600 mt-4 font-light mb-4">
              {project.description}
            </p>
          </div>

          {project.presentationSlides && (
            <p className="text-center">
              View presentation slides{" "}
              <Link href={project.presentationSlides} target="_blank" className="text-ennovate-dark-blue font-semibold hover:underline hover:underline-offset-2">
                here
              </Link>
              !
            </p>
          )}


          <div className="flex justify-center p-6 pt-2 gap-7 mt-4 shrink">
            <button onClick={() => {
              if (project.businessProposal) {
                router.push(`/resources/business-proposals/${project.businessProposal._id}`);
              }
            }} disabled={project.businessProposal === null} className="min-w-32 rounded-md bg-ennovate-main py-2 px-4 border border-transparent text-center text-md text-white transition-all shadow-md hover:bg-ennovate-dark-blue disabled:opacity-50 disabled:cursor-not-allowed" type="button">
              Business Report
            </button>
            <button onClick={() => {
              if (project.blog) {
                router.push(project.blog.mediumUrl);
              }
            }} disabled={project.businessProposal === null} className="min-w-32 rounded-md bg-ennovate-main py-2 px-4 border border-transparent text-center text-md text-white transition-all shadow-md hover:bg-ennovate-dark-blue disabled:opacity-50 disabled:cursor-not-allowed" type="button">
              Medium Post
            </button>
          </div>
          {isAuthenticated &&
            <div className="flex justify-center pb-4 gap-7">
              <button onClick={() => router.push(`/admin/projects?update=${project._id}`)} className="rounded-md bg-ennovate-main py-2 px-4 border border-transparent text-center text-md text-white transition-all shadow-md hover:bg-ennovate-dark-blue disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                Update
              </button>
              <button onClick={() => {
                setSelectedProject(project);
                setModalState('delete');
              }} className="rounded-md bg-ennovate-main py-2 px-4 border border-transparent text-center text-md text-white transition-all shadow-md hover:bg-ennovate-dark-blue disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                Delete
              </button>
              <button onClick={() => {
                setSelectedProject(project);
                setModalState('slide');
              }} className="rounded-md bg-ennovate-main py-2 px-4 border border-transparent text-center text-md text-white transition-all shadow-md hover:bg-ennovate-dark-blue disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                Add Slide
              </button>
            </div>}
        </div>))
      }


      {
        (modalState != 'close' && selectedProject) && (
          <div
            className="fixed inset-0 flex justify-center items-center w-full h-full z-50 bg-black bg-opacity-50"
            data-cy="delete-modal"
          >
            <div className="relative bg-white rounded-xl shadow p-8">
              <button
                type="button"
                className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                data-modal-hide="popup-modal"
                onClick={() => setModalState('close')}
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
                  {modalState == 'delete' ? `Remove ${selectedProject.name}?` : `Add presentation slides for ${selectedProject.name}`}
                </h3>
                {modalState == 'slide' && (
                  <input
                    id="description"
                    onChange={(e) => {
                      setSlideLink(e.target.value);
                      console.log(slideLink);
                    }}
                    className="bg-white border border-ennovate-grey text-ennovate-main text-sm rounded-md focus:ring-ennovate-main focus:border-ennovate-main block w-full p-2.5 mb-4"
                    placeholder={`${selectedProject.name}'s Presentation Slides Link`}
                  />
                )}
                <button
                  data-modal-hide="popup-modal"
                  type="button"
                  className="text-white bg-ennovate-main hover:bg-ennovate-dark-blue font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                  disabled={action}
                  style={{ opacity: action ? 0.7 : 1 }}
                  onClick={handleAction}
                >
                  {action ? (modalState == 'delete' ? "Deleting..." : "Setting slides...") : (modalState == 'delete' ? "Yes, I'm sure" : "Set Presentation Slides")}
                </button>
                <button
                  data-modal-hide="popup-modal"
                  type="button"
                  className="py-2.5 px-5 ms-3 text-sm font-semibold text-ennovate-dark-blue bg-white rounded-lg border border-gray-200 hover:bg-gray-100"
                  onClick={() => setModalState('close')}
                  disabled={action}
                  style={{ opacity: action ? 0.7 : 1 }}
                  data-cy="cancel-delete-button"
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
