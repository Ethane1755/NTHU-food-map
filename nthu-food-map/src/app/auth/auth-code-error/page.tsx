import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">登入失敗</h1>
        <p className="text-gray-600 mb-6">
          登入過程中發生錯誤，請重新嘗試登入。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
}
