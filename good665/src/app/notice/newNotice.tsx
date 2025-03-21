import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createNotice } from "../lib/api";
import { useRouter } from "next/router";

export default function NewNotice() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: createNotice,
        onSuccess: () => {
            router.push("/");
        }
    });

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        mutation.mutate({ title, content });
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">새 공지 추가</h1>
            <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-2">
                    <label className="block">제목</label>
                    <input 
                        type="text" 
                        className="border p-2 w-full"
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="mb-2">
                    <label className="block">내용</label>
                    <textarea 
                        className="border p-2 w-full"
                        value={content} 
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>
                <button 
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2"
                >
                    저장
                </button>
            </form>
        </div>
    );
}
