import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { VerifyEmailModal } from "@/components/auth/verify-email-modal";
import { AuthProvider, useAuth } from "@/context/auth-context";

function ModalTrigger() {
  const { openModal } = useAuth();
  return (
    <button onClick={() => openModal("verify-email", "member@domain.co.uk")}>
      Trigger Verify Modal
    </button>
  );
}

describe("VerifyEmailModal (6-Digit OTP Flow)", () => {
  it("renders 6 digit inputs and handles typing", () => {
    render(
      <AuthProvider>
        <ModalTrigger />
        <VerifyEmailModal />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Trigger Verify Modal").click();
    });

    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    expect(screen.getByText(/member@domain\.co\.uk/i)).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBe(6);

    fireEvent.change(inputs[0], { target: { value: "4" } });
    expect((inputs[0] as HTMLInputElement).value).toBe("4");
  });

  it("distributes 6 digits when user pastes a code into inputs", () => {
    render(
      <AuthProvider>
        <ModalTrigger />
        <VerifyEmailModal />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Trigger Verify Modal").click();
    });

    const inputs = screen.getAllByRole("textbox");

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "852963",
      },
    });

    expect((inputs[0] as HTMLInputElement).value).toBe("8");
    expect((inputs[1] as HTMLInputElement).value).toBe("5");
    expect((inputs[2] as HTMLInputElement).value).toBe("2");
    expect((inputs[3] as HTMLInputElement).value).toBe("9");
    expect((inputs[4] as HTMLInputElement).value).toBe("6");
    expect((inputs[5] as HTMLInputElement).value).toBe("3");
  });

  it("enforces disabled resend timer with 60-second countdown display", () => {
    render(
      <AuthProvider>
        <ModalTrigger />
        <VerifyEmailModal />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Trigger Verify Modal").click();
    });

    expect(screen.getByText(/resend code in/i)).toBeInTheDocument();
    expect(screen.getByText(/60s/i)).toBeInTheDocument();
  });
});
