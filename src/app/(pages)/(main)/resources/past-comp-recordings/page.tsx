'use client'

import Loading from "@/components/loading/loading";
import { IPastCompRecording } from "@/models/PastCompRecording"
import PageCenteringWrapper from "@/wrappers/pageCenteringWrapper";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react"

export default function PastCompRecordings() {
    const [pastCompRecordings, setPastCompRecordings] = useState<IPastCompRecording[] | null>(null);

    useEffect(() => {
        const initializeData = async () => {
            const res = await axios.post("/api/past-comp-recordings/query");
            setPastCompRecordings(res.data);
            console.log(res.data)
        };

        initializeData();
    }, []);

    if (!pastCompRecordings) {
        return (
            <PageCenteringWrapper>
                <Loading />
            </PageCenteringWrapper>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mx-8 mt-8">
            {pastCompRecordings.map((p) => (
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
                    <img className="p-4 rounded-t-lg" src={`/logos/enactus-logo.webp`} alt="product image" />
                    <div className="px-5 pb-5 flex flex-col items-center gap-2">
                        <h5 className="text-xl text-center font-semibold tracking-tight text-gray-900">
                            {p.title}
                        </h5>
                        <span className="text-lg font-bold text-gray-900">{p.month}</span>
                        <Link href={p.videoUrl} target="blank">
                            <button
                                className="text-white bg-ennovate-main hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-ennovate-main/30 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                                See video
                            </button>
                        </Link>
                    </div>

                </div>))
            }
        </div>
    )
}