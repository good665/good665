import { useQuery } from "@tanstack/react-query";
import { getNotices, deleteNotice } from "../lib/api";
import { useRouter } from "next/router";
// 공지사항 목록 페이지
export default function Home() {
    const { data: notices, refetch } = useQuery({
        queryKey: ["notices"],
        queryFn: getNotices
    });
    
    const router = useRouter();

    const handleDelete = async (id) => {
        await deleteNotice(id);
        refetch(); // 데이터 갱신
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">공지사항</h1>
            <button 
                className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                onClick={() => router.push("/new")}
            >
                새 공지 추가
            </button>
            <ul className="mt-4">
                {notices?.map((notice) => (
                    <li key={notice.id} className="border p-4 my-2">
                        <h2 className="text-lg font-semibold">{notice.title}</h2>
                        <p>{notice.content}</p>
                        <div className="mt-2">
                            <button 
                                className="bg-gray-500 text-white px-2 py-1 mr-2"
                                onClick={() => router.push(`/notice/${notice.id}`)}
                            >
                                상세보기
                            </button>
                            <button 
                                className="bg-red-500 text-white px-2 py-1"
                                onClick={() => handleDelete(notice.id)}
                            >
                                삭제
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
