import { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";

import { useAuth } from "@/context/AuthContext";

/** 상담·예약 신청의 연락처. 저장된 번호를 미리 채우고, 고치면 계정의 번호가 바뀜 */
export function useContactPhone() {
  const { user, refreshUser } = useAuth();
  const [input, setInput] = useState(user?.phone ?? "");
  const phone = input.trim();

  return {
    input,
    setInput,
    phone,
    // 신청 성공 후 호출. 실패해도 신청은 이미 완료됨
    syncUser: async () => {
      if (phone !== (user?.phone ?? "").trim()) {
        await refreshUser().catch(() => {});
      }
    },
  };
}

export function ContactPhoneField({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  return (
    <>
      <Text style={styles.label}>연락받을 전화번호</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="010-1234-5678"
        keyboardType="phone-pad"
        autoComplete="tel"
        accessibilityLabel="연락받을 전화번호"
      />
      <Text style={styles.helper}>시설에서 연락할 때 사용하며, 이 번호가 내 연락처로 저장됩니다.</Text>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 10, marginTop: 12 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#333",
  },
  helper: { fontSize: 12, color: "#777", marginTop: 6, marginBottom: 8, lineHeight: 18 },
});
