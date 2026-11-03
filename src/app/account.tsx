import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { alertMessage } from "@/lib/alert";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/storage";

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [socialOnly, setSocialOnly] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<{ socialOnly: boolean }>("/api/account")
      .then((account) => {
        if (active) setSocialOnly(account.socialOnly);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "계정 정보를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError("");
    try {
      await apiFetch("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      // 저장은 이미 끝났으므로 갱신 실패를 저장 실패로 보이지 않게 함
      await refreshUser().catch(() => {});
      alertMessage("저장 완료", "내 정보를 저장했습니다.");
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "내 정보를 저장하지 못했습니다.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("현재 비밀번호를 입력해 주세요.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("새 비밀번호가 서로 다릅니다.");
      return;
    }

    setChangingPassword(true);
    try {
      const { token } = await apiFetch<{ token: string }>("/api/account/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      // 이전 토큰은 무효가 되므로 바로 교체
      await saveToken(token);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      alertMessage("변경 완료", "비밀번호를 변경했습니다. 다른 기기에서는 다시 로그인해 주세요.");
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function withdraw() {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/account/withdraw", {
        method: "POST",
        body: JSON.stringify(socialOnly ? {} : { password }),
      });
      // 이후 이동은 AuthGate가 맡음 (로그아웃되면 /login으로)
      await logout();
      alertMessage("탈퇴 완료", "탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function confirmWithdraw() {
    if (!socialOnly && !password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    const message = "탈퇴하면 되돌릴 수 없습니다. 정말 탈퇴하시겠습니까?";
    if (Platform.OS === "web") {
      if (window.confirm(message)) withdraw();
      return;
    }
    Alert.alert("회원 탈퇴", message, [
      { text: "취소", style: "cancel" },
      { text: "탈퇴하기", style: "destructive", onPress: withdraw },
    ]);
  }

  if (!user) return null;

  const isOwner = user.role === "BUSINESS_OWNER";
  const isAdmin = user.role === "ADMIN";
  // 소셜 가입에서 이메일을 받지 못하면 임시 주소가 저장됨
  const email = user.email.endsWith("@social.invalid") ? "소셜 로그인 계정" : user.email;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
        <Text style={styles.back}>‹ 돌아가기</Text>
      </Pressable>

      <Text style={styles.title}>내 정보</Text>

      <View style={styles.card}>
        <Text style={styles.label}>이메일 (변경할 수 없습니다)</Text>
        <Text style={styles.value}>{email}</Text>

        <Text style={styles.inputLabel}>이름</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={100} accessibilityLabel="이름" />

        <Text style={styles.inputLabel}>전화번호</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="010-1234-5678"
          keyboardType="phone-pad"
          accessibilityLabel="전화번호"
        />

        {!!profileError && <Text style={styles.error}>{profileError}</Text>}

        <Pressable
          style={[styles.primaryButton, savingProfile && styles.disabled]}
          accessibilityRole="button"
          disabled={savingProfile}
          onPress={saveProfile}
        >
          {savingProfile ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>저장</Text>}
        </Pressable>
      </View>

      {socialOnly === false && (
        <>
          <Text style={styles.sectionTitle}>비밀번호 변경</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>현재 비밀번호</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="현재 비밀번호"
            />

            <Text style={styles.inputLabel}>새 비밀번호</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="영문과 숫자를 포함해 8자 이상"
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="새 비밀번호"
            />

            <Text style={styles.inputLabel}>새 비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              value={newPasswordConfirm}
              onChangeText={setNewPasswordConfirm}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="새 비밀번호 확인"
            />

            {!!passwordError && <Text style={styles.error}>{passwordError}</Text>}

            <Pressable
              style={[styles.primaryButton, changingPassword && styles.disabled]}
              accessibilityRole="button"
              disabled={changingPassword}
              onPress={changePassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>비밀번호 변경</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>회원 탈퇴</Text>

      {isAdmin ? (
        <Text style={styles.notice}>관리자 계정은 앱에서 탈퇴할 수 없습니다.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.warning}>탈퇴하면 다음과 같이 처리되며 되돌릴 수 없습니다.</Text>
          <Text style={styles.item}>• 이름, 이메일, 전화번호, 문의 내용이 삭제됩니다.</Text>
          <Text style={styles.item}>• 진행 중인 상담·방문 예약이 취소됩니다.</Text>
          {isOwner && (
            <>
              <Text style={styles.item}>• 광고 자동 결제가 해지되고 등록된 카드가 삭제됩니다. 이미 결제한 금액은 자동으로 환불되지 않습니다.</Text>
              <Text style={styles.item}>• 운영 중인 시설이 비공개로 바뀌고, 시설에 들어온 신청이 취소됩니다.</Text>
              <Text style={styles.item}>• 검토 중인 시설 소유권 신청이 거절되고 제출한 서류가 삭제됩니다.</Text>
            </>
          )}

          {socialOnly === null && !error && <ActivityIndicator color="#39765B" style={styles.loader} />}

          {socialOnly === false && (
            <>
              <Text style={styles.inputLabel}>비밀번호 확인</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                accessibilityLabel="비밀번호 확인"
              />
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          {socialOnly !== null && (
            <Pressable
              style={[styles.button, submitting && styles.disabled]}
              accessibilityRole="button"
              disabled={submitting}
              onPress={confirmWithdraw}
            >
              {submitting ? <ActivityIndicator color="#C62828" /> : <Text style={styles.buttonText}>회원 탈퇴</Text>}
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 24, paddingTop: 48, paddingBottom: 40 },
  back: { color: "#39765B", fontSize: 15, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "700", color: "#26352D", marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#26352D", marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#E8E8E8" },
  label: { fontSize: 12, color: "#777", marginTop: 10, marginBottom: 3 },
  value: { fontSize: 15, color: "#26352D" },
  notice: { fontSize: 14, color: "#555", lineHeight: 21 },
  warning: { fontSize: 14, fontWeight: "700", color: "#C62828", marginBottom: 8, lineHeight: 21 },
  item: { fontSize: 13, color: "#444", lineHeight: 21, marginTop: 4 },
  loader: { marginTop: 16 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 16, marginBottom: 8 },
  primaryButton: { backgroundColor: "#39765B", borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 16 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  error: { color: "#C62828", fontSize: 13, marginTop: 12, lineHeight: 20 },
  button: { borderWidth: 1.5, borderColor: "#D9534F", borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 16 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#C62828", fontSize: 15, fontWeight: "700" },
});
