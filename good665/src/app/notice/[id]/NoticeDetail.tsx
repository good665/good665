import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { getNoticeById } from "../../lib/api";

export default function NoticeDetail() {
    const router = useRouter();
    const { id } = router.query;
    
    const { data: notice, isLoading } = useQuery({
        queryKey: ["notice", id],
        queryFn: () => getNoticeById(id),
        enabled: !!id
    });

    if (isLoading) return <p>Loading...</p>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">{notice?.title}</h1>
            <p className="mt-2">{notice?.content}</p>
            <button 
                className="bg-gray-500 text-white px-4 py-2 mt-4"
                onClick={() => router.push("/")}
            >
                목록으로 돌아가기
            </button>
        </div>
    );
}
