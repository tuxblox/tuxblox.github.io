# Identifying TuxBlox

TuxBlox does not hide the fact that it is TuxBlox. The compatibility layer exports three functions
from `ntdll.dll` that any Windows program running inside the virtual drive can call, so software
that needs to know whether it is running under TuxBlox can ask directly instead of inferring it
from behaviour.

## The exports

| Function | Returns |
|---|---|
| `tuxblox_get_version` | The compatibility layer's own version, such as `3.9.0` |
| `tuxblox_get_kernel` | The host kernel, such as `Linux 6.17.0-arch1-1 x86_64` |
| `tuxblox_get_arch` | `x86_64` or `arm64` |

All three take no arguments and return a pointer to a NUL-terminated ASCII string that stays valid
for the lifetime of the process. None of them ever returns `NULL`. They are `cdecl`, and they are
exported by name, so `GetProcAddress` finds them without knowing an ordinal.

## How to check

**The presence of the export is the signal.** The strings are detail — a program that only needs
to know whether it is running under TuxBlox should check whether the function resolves at all:

```c
#include <windows.h>
#include <stdio.h>

typedef const char * (*tuxblox_getter)(void);

int main(void)
{
    HMODULE ntdll = GetModuleHandleA("ntdll.dll");
    tuxblox_getter version = (tuxblox_getter)GetProcAddress(ntdll, "tuxblox_get_version");

    if (!version) {
        printf("not TuxBlox\n");
        return 0;
    }

    printf("TuxBlox %s\n", version());
    return 0;
}
```

## Where the answers come from

The version is **compiled into the library**. Nothing on disk and no setting decides what it
answers, so it cannot be changed by editing a file or setting a variable.

It is the compatibility layer's own version, not a release number, and it carries no channel.
Both of those are deliberate:

- One build of the layer ships in **several releases**. A release number compiled into the binary
  would be correct for the first release that carried it and wrong for every one after.
- A component version is **shared by every channel**. The same layer build serves stable, canary
  and experimental, which is why one copy of it is published rather than three, so a channel
  compiled in would be wrong the moment a build is promoted.

The kernel and architecture come from `uname` on the host.

## Resolving a release and channel

Every published release file lists the versions of the components it is built from, so a layer
version can be resolved to the releases that contain it by reading those files from
`setup.tuxblox.net`.

Expect that lookup to return **more than one answer**. A single layer version legitimately appears
in several releases and on more than one channel, which is exactly why this interface reports the
version it can state as fact and leaves the rest to be looked up.

## What this is and is not

This is a courtesy, not a security feature, and it is worth being clear about the difference.

- It tells a program what TuxBlox *is*. It says nothing about the person using it, and nothing is
  sent anywhere — the answers only exist when a program asks for them.
- It is not tamper-proof. Anyone who edits their own copy of TuxBlox can remove these exports, in
  the same way they could change anything else on their own machine. It identifies an unmodified
  TuxBlox honestly; it cannot speak for a modified one.
- It is not a request for any particular treatment, and it carries no promise about how any
  software will behave when it finds TuxBlox. What other software does with this information is
  entirely that software's decision.

## Stability

These three functions are a stable interface. Their names, signatures and the meaning of their
return values will not change without a major version of the compatibility layer. The exact format
of the kernel string follows `uname` and may vary between distributions, so treat it as text to
display or log rather than something to parse.
