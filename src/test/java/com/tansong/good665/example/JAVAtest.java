package com.tansong.good665.example;

import java.util.Scanner;
import org.junit.jupiter.api.Test;

import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class JAVAtest {

    //Hello World!를 출력하시오.
    @Test
	public void contextLoads_2557() {
		System.out.println("helloWorld");
	}

    //두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.
    @Test
	public void contextLoads_1000() {
        Scanner sc = new Scanner(System.in);
        int A = sc.nextInt();
        int B = sc.nextInt();
        System.out.println(A + B);

        sc.close();
    }

    //두 정수 A와 B를 입력받은 다음, A-B를 출력하는 프로그램을 작성하시오.
    @Test
	public void contextLoads_1001() {
        Scanner sc = new Scanner(System.in);
        int A = sc.nextInt();
        int B = sc.nextInt();
        System.out.println(A - B);

        sc.close();
    }

    //두 정수 A와 B를 입력받은 다음, A×B를 출력하는 프로그램을 작성하시오.
    //1 2
    //2
    @Test
	public void contextLoads_10998() {
        Scanner sc = new Scanner(System.in);
        int A = sc.nextInt();
        int B = sc.nextInt();
        System.out.println(A * B);

        sc.close();

    }
    //두 정수 A와 B를 입력받은 다음, A/B를 출력하는 프로그램을 작성하시오.
    //1 3
    //0.33333333333333333333333333333333
    //4 5
    //0.8    
    @Test
	public void contextLoads_1008() {
        Scanner sc = new Scanner(System.in);
        double A = sc.nextInt();
        double B = sc.nextInt();
        System.out.println(A - B);

        sc.close();
    }

    //두 자연수 A와 B가 주어진다. 이때, 
    //A+B, A-B, A*B, A/B(몫), A%B(나머지)를 
    //출력하는 프로그램을 작성하시오. 
    //7 3
    // 10
    // 4
    // 21
    // 2
    // 1
    @Test
	public void contextLoads_10869() {
        Scanner sc = new Scanner(System.in);
        double A = sc.nextInt();
        double B = sc.nextInt();

        sc.close();

        System.out.println(A + B);
        System.out.println(A - B);
        System.out.println(A * B);
        System.out.println(A / B);
        System.out.println(A % B);

    }
    // 준하는 사이트에 회원가입을 하다가 joonas라는 아이디가 
    // 이미 존재하는 것을 보고 놀랐다. 준하는 놀람을 ??!로 표현한다. 
    // 준하가 가입하려고 하는 사이트에 
    // 이미 존재하는 아이디가 주어졌을 때, 
    // 놀람을 표현하는 프로그램을 작성하시오.
    //joonas
    //joonas??!

    //baekjoon
    //baekjoon??!
    @Test
	public void contextLoads_10926() {
        Scanner sc = new Scanner(System.in);
        String str = sc.nextLine();

        System.out.println(str + "??!");

        sc.close();
    }

    //불기 연도가 주어질 때 이를 서기 연도로 바꿔 주는 프로그램을 작성하시오.
    //불기 연도를 서기 연도로 변환한 결과를 출력한다.
    //2541
    //1998
    @Test
	public void contextLoads_18108() {
        Scanner sc = new Scanner(System.in);
        int year = sc.nextInt();

        System.out.println(year - 543);
    }

//     (A+B)%C는 ((A%C) + (B%C))%C 와 같을까?
// (A×B)%C는 ((A%C) × (B%C))%C 와 같을까?
// 세 수 A, B, C가 주어졌을 때, 
// 위의 네 가지 값을 구하는 프로그램을 작성하시오.
//첫째 줄에 A, B, C가 순서대로 주어진다
//첫째 줄에 (A+B)%C, 둘째 줄에 ((A%C) + (B%C))%C, 
//셋째 줄에 (A×B)%C, 넷째 줄에 ((A%C) × (B%C))%C를 출력한다.
//5 8 4
// 1
// 1
// 0
// 0
    @Test
	public void contextLoads_10430() {
        Scanner sc = new Scanner(System.in);
        int A = sc.nextInt();
        int B = sc.nextInt();
        int C = sc.nextInt();
        System.out.println((A+B)%C);
        System.out.println(((A%C) + (B%C))%C);
        System.out.println((A*B)%C);
        System.out.println(((A%C)*(B%C))%C);
    }
    // (1)과 (2)위치에 들어갈 세 자리 자연수가 주어질 때 
    // (3), (4), (5), (6)위치에 들어갈 값을 구하는 프로그램을 작성하시오.
    //첫째 줄에 (1)의 위치에 들어갈 세 자리 자연수가, 둘째 줄에 (2)의 위치에 들어갈 세자리 자연수가 주어진다.
    //첫째 줄부터 넷째 줄까지 차례대로 (3), (4), (5), (6)에 들어갈 값을 출력한다.
    // 472
    // 385

    // 2360
    // 3776
    // 1416
    // 181720
    @Test //retest
	public void contextLoads_2588() {
        Scanner sc = new Scanner(System.in);
        int A = sc.nextInt();
        String B = sc.next();

        sc.close();

        System.out.println(A * (B.charAt(2) - '0' ));
        System.out.println(A * (B.charAt(1) - '0' ));
        System.out.println(A * (B.charAt(0) - '0' ));
        System.out.println(A * Integer.parseInt(B));
        
    }

    //꼬마 정민이는 이제 A + B 정도는 쉽게 계산할 수 있다. 이제 A + B + C를 계산할 차례이다!
    //A+B+C의 값을 출력한다.
    //77 77 7777
    //7931
    @Test
	public void contextLoads_11382() {
        Scanner sc = new Scanner(System.in);
        int A = sc.nextInt();
        int B = sc.nextInt();
        int C = sc.nextInt();

        System.out.println(A + B + C);
    }



}
