package cx.ivc;

public interface IvcServlet {
    String URI_PREFIX = "ivc+https://s.ivc.cx/";
    
    String name();

    default String uri() {
        return URI_PREFIX + name();
    }

    /** Does this servlet handle the ivc:// object? (prefix + object + modes) */
    boolean handles(IvcUri uri);

    /** Consume a ∆event from the object∆data stream (chat, memo, signaling…) */
    void onDelta(Delta delta);

    /** Full request dispatch (GET/POST/PUT) for custom endpoints */
    IvcResponse service(IvcRequest request);
}
