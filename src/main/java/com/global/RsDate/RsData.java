package com.global.RsDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class RsData<T> {
    private String resultCode;
    private String msg;
    private T date;

    public static <T> RsData of(String resultCode, String msg, T data) {
        return new RsData<T>(resultCode, msg, data);
    }

    public static <T> RsData<T> of(String resultCode, String msg) {
        return new RsData<T>(resultCode, msg, null);
    }

    @JsonIgnore
    public boolean isSuccess() {
        return resultCode.startsWith("S-");
    }

    @JsonIgnore
    public boolean isFaill() {
        return !isSuccess();
    }
}
