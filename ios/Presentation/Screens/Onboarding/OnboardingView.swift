import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    @State private var email: String = ""
    @State private var password: String = ""
    @State private var isSignUp: Bool = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Get started")
                        .font(.title.bold())
                    Text(isSignUp ? "Create an account to start swiping meals." :
                            "Sign in to plan meals and join Dining Tables.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Picker("Mode", selection: $isSignUp) {
                    Text("Sign in").tag(false)
                    Text("Sign up").tag(true)
                }
                .pickerStyle(.segmented)

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .padding(10)
                        .background(RoundedRectangle(cornerRadius: 8).strokeBorder(.secondary.opacity(0.4)))

                    SecureField("Password (min 6 chars)", text: $password)
                        .textContentType(.password)
                        .padding(10)
                        .background(RoundedRectangle(cornerRadius: 8).strokeBorder(.secondary.opacity(0.4)))
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    Task {
                        await handleSubmit()
                    }
                } label: {
                    if authViewModel.isLoading {
                        ProgressView()
                            .tint(.primary)
                            .frame(maxWidth: .infinity)
                    } else {
                        Text(isSignUp ? "Create account" : "Sign in")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(authViewModel.isLoading || email.isEmpty || password.count < 6)

                Spacer()
            }
            .padding()
        }
    }

    private func handleSubmit() async {
        errorMessage = nil
        do {
            if isSignUp {
                try await authViewModel.signUp(email: email, password: password)
            } else {
                try await authViewModel.signIn(email: email, password: password)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}


